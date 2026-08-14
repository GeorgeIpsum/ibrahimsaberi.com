# Design: lonk on Hetzner + DNS migration from Vercel to Cloudflare

**Date:** 2026-07-13
**Status:** Approved design, pending implementation plan

## Goal

Host [lonk](https://github.com/GeorgeIpsum/lonk) at `lonk.ibrahimsaberi.com` on a newly purchased Hetzner Server Auction dedicated server, built as a full homelab platform. This requires migrating authoritative DNS for `ibrahimsaberi.com` from Vercel DNS to Cloudflare while keeping the Vercel-hosted site (apex, `www`, and the `rc` preview branch domain) working unchanged.

## Decisions

| Decision | Choice |
|---|---|
| Server OS | NixOS, installed via nixos-anywhere from the Hetzner rescue system |
| Disk layout | ZFS mirror across the two drives (disko config) |
| Platform layer | Single-node k3s (bundled Traefik ingress) |
| Cluster management | GitOps: Argo CD syncing a **public** `homelab` repo on the user's existing GitHub account (anonymous pull — no deploy key needed) |
| Secrets in the homelab repo | Bitnami **Sealed Secrets**: only encrypted `SealedSecret` manifests are committed; the sealing keypair is backed up out-of-band (password manager + restic) |
| Repo hygiene | gitleaks in CI + pre-commit on the homelab repo; hard rule: no plaintext secrets, no server IPs, ever (public repos have permanent history) |
| OS config location | Separate **public** `nix-config` flake repo. Host-level runtime secrets (Tailscale auth key, etc.) via **sops-nix** (age-encrypted in-repo); eval-time addressing (IPv4/IPv6, deploy target) via a tiny **private `nix-private` repo consumed as a flake input** |
| Origin exposure | NixOS firewall allows 80/443 **only from Cloudflare's published IP ranges** (+ tailnet for everything else), so IP-space scanners can't discover the origin by reading the cert off a direct connection |
| Remote access | Tailscale; k3s API (6443) and admin SSH over the tailnet only. Public exposure: 80/443 restricted to Cloudflare IP ranges (22 open only until Tailscale is confirmed, then tailnet-only) |
| TLS | cert-manager with Cloudflare DNS-01 ClusterIssuer; Cloudflare SSL mode Full (strict) |
| `lonk.ibrahimsaberi.com` proxy status | Proxied (orange cloud) |
| Vercel-pointing records | DNS-only (grey cloud), per Vercel's recommendation against proxying |
| lonk image delivery | Dockerfile + GitHub Actions in the lonk repo → `ghcr.io/georgeipsum/lonk` |
| lonk write-path protection | Traefik basic-auth middleware on `/api` (lonk has no built-in auth) |
| Backups | k8s CronJob: SQLite `.backup` + restic to Hetzner Storage Box (or included backup space if present) |

## Key research findings the design rests on

- **lonk** is Rust (Rocket 0.5) + embedded Vite SPA, SQLite-only (`LONK_DB` path env var, schema auto-created), listens on `ROCKET_PORT` (default 8000, needs `ROCKET_ADDRESS=0.0.0.0` in a container). No Dockerfile exists; `deploy/lonkd.service` exists for bare-metal. **No authentication**: `POST /api/links` is open, and `GET /<id>/status` makes outbound requests (mild SSRF/abuse surface) — hence proxy-layer gating.
- **`rc.ibrahimsaberi.com` is a plain branch domain** (confirmed by user), not a Preview Deployment Suffix. It needs only a single DNS-only CNAME on Cloudflare. Per-deployment preview URLs live on `*.vercel.app` and are unaffected by the migration. (Wildcard `*.rc` would have required the `_acme-challenge` NS-delegation workaround — not needed.)
- **Current zone is tiny** (verified by dig 2026-07-13): apex A `216.198.79.65` + `64.29.17.65`; `www` and `rc` CNAME to Vercel (flattened values observed; exact CNAME targets must be copied from the Vercel dashboard); CAA `letsencrypt.org` / `pki.goog` / `sectigo.com`; **no MX, SPF, DKIM, DMARC, or `_vercel` TXT records** — no email to migrate.
- **Vercel with third-party DNS**: fully supported. Records must match project Domain Settings (`vercel domains inspect ibrahimsaberi.com`). Non-wildcard cert issuance uses HTTP-01 and keeps working automatically. Nameserver cutover is effectively zero-downtime because record values don't change.
- **Hetzner auction boxes** arrive with no OS, administered via Robot; rescue system + kexec is the nixos-anywhere path. Drives are used — SMART-check before install; Hetzner replaces defective drives free. No snapshots/cloud features; monthly billing, no setup fee.
- **k3s on NixOS** is a first-class module (`services.k3s`). ZFS requires a containerd snapshotter accommodation for k3s (or ext4 zvol for `/var/lib/rancher`).

## Architecture

```
Internet
  │
  ├── ibrahimsaberi.com / www / rc ──(Cloudflare DNS, grey cloud)──► Vercel (unchanged)
  │
  └── lonk.ibrahimsaberi.com ──(Cloudflare proxy, orange cloud)──► Hetzner box :443
                                                                      │
                                                              NixOS (nix-config repo)
                                                                      │
                                                              k3s ── Traefik (real IPs via
                                                                      │    trusted CF ranges)
                                                                      ├── cert-manager (CF DNS-01)
                                                                      ├── Argo CD ◄── homelab repo (GitHub)
                                                                      ├── kube-prometheus-stack
                                                                      └── lonk (Deployment + PVC + Ingress)
Tailnet ──► SSH / kubectl (6443)                                          ▲
                                                              ghcr.io/georgeipsum/lonk
                                                                  (GitHub Actions build)
```

Two declarative control planes, both **public**, with all sensitive material factored out:
- **nix-config repo (public)** → the OS layer (disks, SSH, firewall, fail2ban, smartd, tailscale, k3s itself). Deployed via `nixos-rebuild switch --flake --target-host`. Two escape hatches keep it publishable:
  - **sops-nix** for runtime secrets (Tailscale auth key, smartd email creds, …): age-encrypted files committed in-repo, decrypted only at system activation into `/run/secrets`. The age private key lives on the box (+ password-manager backup), never in git.
  - **`nix-private` repo (private, tiny)** consumed as a flake input: carries only eval-time values that can't be encrypted because NixOS needs them at build time and the Nix store is world-readable — the server's IPv4/IPv6, static network config, deploy target hostname. The public flake imports it; nothing else lives there.
- **homelab repo (public)** → everything inside k3s, synced by Argo CD (app-of-apps). Public repo, so Argo pulls anonymously — no credentials to manage.

### Public-repo security model

What makes the homelab repo safe to publish:

1. **Secrets**: never committed in plaintext. The **Sealed Secrets** controller runs in-cluster; secrets are encrypted on the laptop with `kubeseal` against the cluster's public cert and committed as `SealedSecret` manifests, which only this cluster's private key can decrypt. Inventory of sealed secrets: Cloudflare API token (cert-manager), restic password + Storage Box credentials, Traefik basic-auth htpasswd (strong random password — bcrypt of a weak one is offline-crackable once public), Grafana admin password.
   - The sealing keypair is exported once and backed up out-of-band (password manager + restic). Without it, a cluster rebuild can't decrypt the repo's secrets and everything must be re-sealed; with it, rebuild is turnkey.
2. **No IPs anywhere public**: the server's IPv4/IPv6 never appear in either public repo — DNS records live in Cloudflare's dashboard, ingress manifests are hostname-only, and all addressing in nix-config is referenced through the private `nix-private` flake input. OS-layer runtime secrets are sops-nix-encrypted in-repo (safe to publish).
3. **Leak prevention**: gitleaks runs as a pre-commit hook and in CI on **both public repos**. History on a public repo is forever — a secret or IP committed even briefly is burned and must be rotated (or, for the IP, treated as leaked and defended by the firewall layer), not just deleted.
4. **Origin undiscoverability**: hostname → IP mapping is protected at both ends: nothing in git carries the IP, and the origin only accepts 80/443 from Cloudflare's IP ranges, so scanning Hetzner's IP space never yields a certificate for `lonk.ibrahimsaberi.com`. (The hostname itself is public regardless via certificate-transparency logs — that's expected and fine.)
5. **No private images**: lonk is MIT/public, so `ghcr.io/georgeipsum/lonk` is public — no imagePullSecrets.

## Phases

### Phase 1 — Prep (no user-visible changes)

1. Record exact Vercel DNS values from the dashboard / `vercel domains inspect ibrahimsaberi.com` (apex A records, `www` + `rc` CNAME targets).
2. lonk repo: add multi-stage Dockerfile (node builds `web/dist` → rust builds `lonkd` → slim runtime) + GitHub Actions workflow → `ghcr.io/georgeipsum/lonk`.
3. Create the **public** `homelab` repo: Argo app-of-apps layout, gitleaks pre-commit hook + CI workflow **before any other commit**, README noting the no-secrets/no-IPs rule.
4. Create the Hetzner host in the **public** `nix-config` flake repo (disko ZFS mirror, hardening, tailscale, k3s, firewall restricting 80/443 to Cloudflare's IP ranges), with gitleaks hooks/CI here too. Set up **sops-nix** (generate the age keypair, back up the private key) and the **private `nix-private` repo** as a flake input holding IPs/addressing/deploy target only.
5. Generate strong random credentials for everything that will be sealed later (basic-auth, Grafana, restic) into the password manager.

### Phase 2 — Hetzner base install

1. Robot: upload SSH key, activate rescue system, boot.
2. From rescue: `smartctl -a` both drives (Power_On_Hours, reallocated sectors / wear). Defective → free replacement via Robot support before proceeding.
3. Run nixos-anywhere from laptop against the rescue system → installs the flake (ZFS mirror via disko).
4. Verify: boot, SSH via key, tailscale up, firewall exposing 80/443 **to Cloudflare ranges only** (SSH/6443 tailnet-only once Tailscale is confirmed working). From an outside host, confirm a direct `curl -k https://<ip>` times out. Set rDNS in Robot.

### Phase 3 — Platform bootstrap

1. k3s up via the NixOS module (with the ZFS/containerd accommodation). Traefik configured to trust Cloudflare IP ranges for real client IPs.
2. Bootstrap Argo CD once by hand; from then on Argo manages everything (itself included) from the public homelab repo (anonymous HTTPS pull).
3. **Sealed Secrets controller first** (it gates every secret-bearing app): install via Argo, export and back up the sealing keypair immediately, then seal + commit the secrets inventory (Cloudflare token, restic creds, htpasswd, Grafana).
4. Argo apps: cert-manager (+ ClusterIssuer consuming the sealed Cloudflare token), kube-prometheus-stack.
5. Backup CronJob scaffolding (restic → Storage Box; check Robot for included backup space first). Restic credentials via SealedSecret.

### Phase 4 — DNS cutover

1. Add `ibrahimsaberi.com` to Cloudflare (free plan). Ignore/verify the quick scan; **manually create the full zone**:

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `@` | per Vercel dashboard (observed: `216.198.79.65`, `64.29.17.65`) | DNS only |
| CNAME | `www` | per Vercel dashboard (project-specific `*.vercel-dns-0xx.com`) | DNS only |
| CNAME | `rc` | per Vercel dashboard (same target) | DNS only |
| A | `lonk` | Hetzner IPv4 | Proxied |
| AAAA | `lonk` | Hetzner IPv6 (from the /64) | Proxied |
| CAA | `@` | `0 issue "letsencrypt.org"`, `0 issue "pki.goog"`, `0 issue "sectigo.com"` | — |

2. Cloudflare zone settings: SSL/TLS mode **Full (strict)**; leave HTML-rewriting features (Rocket Loader etc.) off.
3. Confirm DNSSEC is disabled at the registrar; swap nameservers to Cloudflare's assigned pair.
4. Verify before/after: `dig @<cf-ns>` matches expectations; Vercel dashboard shows Valid Configuration; site + `rc` load; propagation window 24–48h. Keep the Vercel DNS zone intact (don't remove the domain from Vercel) until Cloudflare reports Active.
5. Rollback: point nameservers back at Vercel; zone contents there are untouched.

### Phase 5 — lonk live

1. Homelab repo: lonk Deployment (env `LONK_DB=/data/lonk.db`, `ROCKET_ADDRESS=0.0.0.0`, `ROCKET_PORT=8000`), PVC (local-path on ZFS), Service, Ingress (cert-manager TLS, Traefik basic-auth middleware on `/api`).
2. Public surface: `GET /<id>` redirects and `GET /<id>/qr` open; link creation requires basic auth. (Alternative if prompts annoy: Cloudflare Access on `/api/*`. Real fix — auth in lonk — is on lonk's roadmap, out of scope here.)
3. Verify end-to-end through the orange cloud: create link (authed), follow redirect, QR renders, cert is valid LE, client IPs logged correctly. Configure the `lonk` CLI (`lonk setup https://lonk.ibrahimsaberi.com`).
4. Wire lonk + node metrics into Grafana; add backup CronJob for the SQLite file and test a restore.

## Testing / verification checklist

- Drives: SMART clean (or replaced) before install.
- OS: reboot survives; tailscale reachable; public ports limited as designed.
- DNS: `dig NS` → Cloudflare pair; apex/`www`/`rc` unchanged behavior; Vercel "Valid Configuration"; no cert warnings on the Vercel site.
- lonk: TLS valid via orange cloud (Full strict — no redirect loops); unauthenticated `POST /api/links` rejected; redirect + QR public; SQLite persists across pod restart; restic restore tested once.
- Public-repo safety: gitleaks green in CI on both public repos; grep both repos' full history for the server's IPv4/IPv6 → zero hits; nix-config evaluates with the `nix-private` input but contains no plaintext secrets (`sops` files only); direct `curl https://<ip>` from outside Cloudflare fails; sealing keypair and age key restorable from backup (test each once).
- Rebuildability drill (optional but recommended): the box should be reconstructable from nix-config + nix-private + homelab repos + sealing-key/age-key backups + latest restic snapshot alone.

## Out of scope

- Auth inside lonk itself (roadmap item in that repo).
- Migrating the Vercel-hosted site off Vercel.
- Multi-node k8s, Longhorn/distributed storage, self-hosted git.

## Open items to resolve during implementation

- Exact `www`/`rc` CNAME targets and apex A values from the Vercel dashboard (authoritative over dig observations).
- Whether this auction server includes the free 100GB backup space (check Robot) — else order a Storage Box.
- Cloudflare API token scoping for cert-manager (Zone:DNS:Edit on `ibrahimsaberi.com` only).
- NixOS release channel (current stable at implementation time) and whether k3s uses the ZFS snapshotter or an ext4 zvol for `/var/lib/rancher`.
- Where the sealing-keypair backup lives (password manager entry + restic path) and the re-seal runbook.
- sops-nix key management: age keypair generation, where the private key sits on the box, backup location, and the exact shape of the `nix-private` flake input (schema for IPs/hostnames it exports).
- `nix-private` access during deploys: laptop has it cloned; note that anyone building the public flake without access gets an eval error by design.
- How the NixOS firewall keeps Cloudflare's IP ranges current (they change rarely; a pinned list in nix-config with an update note is acceptable, an auto-refresh timer is nicer).
- Optional layer later: Cloudflare Authenticated Origin Pulls (mTLS) on top of the IP-range firewall.

## Key sources

- Vercel: [Cloudflare with Vercel](https://vercel.com/guides/using-cloudflare-with-vercel) · [Add a domain / verification](https://vercel.com/docs/domains/working-with-domains/add-a-domain) · [Branch domains](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch) · [Wildcards without Vercel NS](https://vercel.com/kb/guide/wildcard-domain-without-vercel-nameservers) · [ERR_TOO_MANY_REDIRECTS fix](https://vercel.com/kb/guide/resolve-err-too-many-redirects-when-using-cloudflare-proxy-with-vercel)
- Cloudflare: [Full setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/) · [SSL modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/) · [Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/)
- Hetzner: [Server Auction FAQ](https://docs.hetzner.com/robot/general/server-auction-faqs/) · [Rescue System](https://docs.hetzner.com/robot/dedicated-server/troubleshooting/hetzner-rescue-system/) · [Robot firewall (stateless!)](https://docs.hetzner.com/robot/dedicated-server/firewall/)
- NixOS: [nixos-anywhere](https://github.com/nix-community/nixos-anywhere) · [disko](https://github.com/nix-community/disko) · [sops-nix](https://github.com/Mic92/sops-nix)
- Secrets/GitOps: [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) · [gitleaks](https://github.com/gitleaks/gitleaks)
- lonk: `README.md`, `crates/lonkd/src/{main.rs,db.rs,routes.rs}`, `deploy/lonkd.service` (no Dockerfile; no auth)
