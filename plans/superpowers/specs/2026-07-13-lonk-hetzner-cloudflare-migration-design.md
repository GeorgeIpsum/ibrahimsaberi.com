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
| Cluster management | GitOps: Argo CD syncing a private `homelab` repo on the user's existing GitHub account |
| OS config location | Separate private `nix-config` flake repo (not in the homelab repo) |
| Remote access | Tailscale; k3s API (6443) and admin SSH over the tailnet only. Public exposure: 80/443 (+ 22 initially, may restrict later) |
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

Two declarative control planes, cleanly split:
- **nix-config repo** → the OS layer (disks, SSH, firewall, fail2ban, smartd, tailscale, k3s itself). Deployed via `nixos-rebuild switch --flake --target-host`.
- **homelab repo** → everything inside k3s, synced by Argo CD (app-of-apps). Argo authenticates to GitHub with a read-only deploy key or fine-grained PAT.

## Phases

### Phase 1 — Prep (no user-visible changes)

1. Record exact Vercel DNS values from the dashboard / `vercel domains inspect ibrahimsaberi.com` (apex A records, `www` + `rc` CNAME targets).
2. lonk repo: add multi-stage Dockerfile (node builds `web/dist` → rust builds `lonkd` → slim runtime) + GitHub Actions workflow → `ghcr.io/georgeipsum/lonk`.
3. Create private `homelab` repo (Argo app-of-apps layout) and the Hetzner host in the `nix-config` flake repo (disko ZFS mirror, hardening, tailscale, k3s).

### Phase 2 — Hetzner base install

1. Robot: upload SSH key, activate rescue system, boot.
2. From rescue: `smartctl -a` both drives (Power_On_Hours, reallocated sectors / wear). Defective → free replacement via Robot support before proceeding.
3. Run nixos-anywhere from laptop against the rescue system → installs the flake (ZFS mirror via disko).
4. Verify: boot, SSH via key, tailscale up, firewall only exposing 80/443 (+22 as configured). Set rDNS in Robot.

### Phase 3 — Platform bootstrap

1. k3s up via the NixOS module (with the ZFS/containerd accommodation). Traefik configured to trust Cloudflare IP ranges for real client IPs.
2. Bootstrap Argo CD once by hand; from then on Argo manages everything (itself included) from the homelab repo.
3. Argo apps: cert-manager (+ ClusterIssuer using a Cloudflare API token scoped to the zone), kube-prometheus-stack.
4. Backup CronJob scaffolding (restic → Storage Box; check Robot for included backup space first).

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
- Rebuildability drill (optional but recommended): the box should be reconstructable from nix-config + homelab repos + latest restic snapshot alone.

## Out of scope

- Auth inside lonk itself (roadmap item in that repo).
- Migrating the Vercel-hosted site off Vercel.
- Multi-node k8s, Longhorn/distributed storage, self-hosted git.

## Open items to resolve during implementation

- Exact `www`/`rc` CNAME targets and apex A values from the Vercel dashboard (authoritative over dig observations).
- Whether this auction server includes the free 100GB backup space (check Robot) — else order a Storage Box.
- Cloudflare API token scoping for cert-manager (Zone:DNS:Edit on `ibrahimsaberi.com` only).
- NixOS release channel (current stable at implementation time) and whether k3s uses the ZFS snapshotter or an ext4 zvol for `/var/lib/rancher`.

## Key sources

- Vercel: [Cloudflare with Vercel](https://vercel.com/guides/using-cloudflare-with-vercel) · [Add a domain / verification](https://vercel.com/docs/domains/working-with-domains/add-a-domain) · [Branch domains](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch) · [Wildcards without Vercel NS](https://vercel.com/kb/guide/wildcard-domain-without-vercel-nameservers) · [ERR_TOO_MANY_REDIRECTS fix](https://vercel.com/kb/guide/resolve-err-too-many-redirects-when-using-cloudflare-proxy-with-vercel)
- Cloudflare: [Full setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/) · [SSL modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/) · [Authenticated Origin Pulls](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/)
- Hetzner: [Server Auction FAQ](https://docs.hetzner.com/robot/general/server-auction-faqs/) · [Rescue System](https://docs.hetzner.com/robot/dedicated-server/troubleshooting/hetzner-rescue-system/) · [Robot firewall (stateless!)](https://docs.hetzner.com/robot/dedicated-server/firewall/)
- NixOS: [nixos-anywhere](https://github.com/nix-community/nixos-anywhere) · [disko](https://github.com/nix-community/disko)
- lonk: `README.md`, `crates/lonkd/src/{main.rs,db.rs,routes.rs}`, `deploy/lonkd.service` (no Dockerfile; no auth)
