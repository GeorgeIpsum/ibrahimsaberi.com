# yt-dlp-wasm — Security Notes & Hardening

Security review of the browser yt-dlp stack (`packages/yt-dlp-wasm`, `services/wisp-server`, `src/services/yt-dlp`, and the CI workflows). This documents the **changes that should be made before any public deployment** — none of the items below are fixed yet.

## Trust model

Two very different exposure surfaces:

- **Client-side** — `packages/yt-dlp-wasm`, `src/services/yt-dlp`, and the `/yt-dlp-test` route run entirely **in the user's own browser tab**. The Next.js app is *not* a proxy and performs no fetching on the user's behalf, so it is **not an SSRF vector**. yt-dlp + ffmpeg.wasm run in a sandboxed Web Worker; the trust assumption is "the user trusts the yt-dlp release and the sites they target." Low server-side risk.
- **Server-side** — **`services/wisp-server` is a publicly-deployable open TCP/UDP proxy that dials arbitrary destinations on behalf of any connecting client.** This is where essentially all of the risk concentrates, and where the high-severity items live.

Severity: 🔴 fix before exposing publicly · 🟡 fix soon · 🟢 defense-in-depth.

---

## 🔴 High

### 1. SSRF / unrestricted egress in the Wisp dialer

**Where:** `services/wisp-server/src/node/dialer.ts` (`net.connect({ host: req.hostname, port: req.port })` for TCP; `dgram` `sock.connect()` for UDP) and `services/wisp-server/src/worker/index.ts` (`connect({ hostname, port })`).

**Risk:** the server dials **any host:port the client names, with no filtering**. On the **Node target** (VPS/container) a client can reach `127.0.0.1`, `169.254.169.254` (cloud instance metadata → credential/role-token theft), and the entire RFC1918 / internal network — a full SSRF pivot into whatever network the proxy runs in. On the **Cloudflare Worker target** it is less severe (no host network or metadata endpoint reachable) but is still an open relay to any public host.

**Change to make:** add an egress guard applied to every `CONNECT` before dialing.
- Resolve the hostname, then **reject** loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`, `fe80::/10`), RFC1918 (`10/8`, `172.16/12`, `192.168/16`), unique-local (`fc00::/7`), `0.0.0.0/8`, and the metadata IP `169.254.169.254`.
- Re-check the **resolved IP** at connect time (not just the hostname) to defeat DNS-rebinding; pin the connection to the validated IP.
- Prefer an explicit **allow-list** of permitted destination hosts/ports where the use case allows it.
- On rejection, reply with Wisp `CLOSE` reason `0x48` (blocked).
- Implement once in a shared `egress-guard` used by both the Node and Worker dialers.

### 2. Authentication is off by default ("fail-open")

**Where:** `services/wisp-server/src/auth.ts` (`checkAuth` returns OK when neither `WISP_TOKEN` nor `ALLOWED_ORIGINS` is set); `services/wisp-server/src/node/index.ts` boots and logs `[auth: OPEN]`.

**Risk:** a deployment that forgets to configure auth is a free, anonymous open proxy attributable to your IP/account (abuse, piracy, attacks, bandwidth bills).

**Change to make:** **fail closed in production.** When `NODE_ENV === "production"` and neither `WISP_TOKEN` nor `ALLOWED_ORIGINS` is configured, refuse to start (or bind to loopback only) instead of serving openly. Keep the open default only for local development, and keep the loud startup warning.

---

## 🟡 Medium

### 3. No DoS / resource limits

**Where:** `services/wisp-server/src/node/index.ts` + `services/wisp-server/src/connection.ts`.

**Risk:** the server accepts **unlimited concurrent WebSocket connections**, with **no idle/lifetime timeout** and **no `maxPayload`** on the `WebSocketServer` (the `ws` default is 100 MiB per message). `maxStreams` (512) is enforced **per connection** only, so unbounded connections ⇒ unbounded sockets/FDs/memory. The advertised client→server flow-control window is not actually enforced (incoming `DATA` is written straight to the destination socket), so a client can flood.

**Change to make:**
- Cap concurrent connections **globally and per-IP**; add a per-IP connection rate limit.
- Add an **idle timeout** and a max connection lifetime; close sockets that stall.
- Set `ws` `maxPayload` to a sane frame ceiling.
- Consider a global stream ceiling and enforcing the client→server window (pause reads when the destination socket's `write()` returns `false`).

### 4. UDP open relay / amplification

**Where:** `services/wisp-server/src/node/dialer.ts` (`udp()`).

**Risk:** arbitrary UDP to any host:port enables reflection/amplification abuse (DNS, NTP, etc.).

**Change to make:** disable UDP unless explicitly enabled via config, or restrict UDP to an allow-list of destinations. Combine with the egress guard from #1.

### 5. No supply-chain integrity (SRI) on runtime-loaded code

**Where:** `packages/yt-dlp-wasm/src/pyodide-worker/boot.ts` (Pyodide via `import()`), `packages/yt-dlp-wasm/src/services-worker/ffmpeg.ts` (ffmpeg core via `toBlobURL`), and `scripts/fetch-yt-dlp-wheel.mjs` (yt-dlp wheel).

**Risk:** Pyodide and the ffmpeg core load from jsDelivr with **no integrity verification**, and the yt-dlp wheel is fetched with **no digest check**. A compromised CDN or asset origin ⇒ arbitrary code execution inside the Pyodide worker (in every user's browser).

**Change to make:**
- Self-host the assets on R2 (the upload pipeline already exists) and/or pin Pyodide + ffmpeg by version **and** verify a SHA-256.
- In `fetch-yt-dlp-wheel.mjs`, verify the downloaded wheel against the `digests.sha256` already present in PyPI's JSON response and record it in the manifest; optionally verify it again client-side before `micropip.install`.

### 6. GitHub Actions pinned to mutable tags, not commit SHAs

**Where:** `.github/workflows/deploy-wisp.yml` and `.github/workflows/upload-assets-r2.yml` (`actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, `cloudflare/wrangler-action@v3`).

**Risk:** these jobs hold `CLOUDFLARE_API_TOKEN` and the R2 credentials. A hijacked action tag could exfiltrate them. (Blast radius is already limited — no `pull_request_target`, `permissions: contents: read`, no untrusted input in `run:` — so only trusted `main`/dispatch runs are affected.)

**Change to make:** pin each action to a full commit SHA (with the version in a trailing comment) and let Dependabot bump them.

### 7. Token handling

**Where:** `services/wisp-server/src/auth.ts` (`req.token !== cfg.token`) and the query-param parsing in `node/index.ts` / `worker/index.ts`.

**Risk:** the token is accepted via `?token=`, which leaks into CDN/proxy access logs, browser history, and referrers; and the comparison is **non-constant-time** (timing side-channel on the token).

**Change to make:** prefer carrying the token in the WebSocket subprotocol over the query param, and compare it with a constant-time equality (`crypto.timingSafeEqual` / a length-safe constant-time check on the Worker).

---

## 🟢 Low / defense-in-depth

- **Origin allow-list is spoofable** (`auth.ts`) — `Origin` is only honored by browsers; a direct (non-browser) attacker sets it freely. Treat `ALLOWED_ORIGINS` as CSRF-style hardening, **not** authentication; `WISP_TOKEN` (or network ACLs) is the real gate.
- **Deploy behind TLS** — without `wss://`, the Wisp `CONNECT` target hostnames and any token travel in plaintext on the WebSocket hop. (The tunneled payload stays end-to-end-encrypted regardless, because libcurl.js terminates TLS in the browser.)
- **Metadata visible to the proxy operator** — even with end-to-end TLS, the Wisp server sees every `CONNECT` host:port. Expected for a proxy; note it in the deployment's privacy posture.

---

## Already mitigated (verified, not action items)

- **`FileStore` is a pure in-memory `Map`** (`packages/yt-dlp-wasm/src/services-worker/file-store.ts`) — no real-disk writes, so a hostile file `name` is just a map key; **no path traversal**. ffmpeg.wasm's MEMFS is likewise sandboxed in-worker.
- **End-to-end TLS through Wisp** — libcurl.js does TLS in the browser, so the proxy (even a free Worker or a `ws://` hop) **cannot read traffic or cookies**.
- **Cookies stay client-side** — user-supplied `cookies.txt` lives only in the in-memory Pyodide FS, host-scoped via yt-dlp's cookiejar; it is never sent to our servers. `NEXT_PUBLIC_WISP_TOKEN` is correctly documented as non-secret.
- **COOP/COEP is narrowly scoped** to `/yt-dlp-test` + `/yt-dlp-wasm/*` (`next.config.ts`) — the rest of the site is not needlessly cross-origin-isolated.
- **CI hygiene** — no `pull_request_target`, least-privilege `permissions: contents: read`, secrets passed via `env:`, no untrusted event input interpolated into `run:`.
- **No secrets committed** — `.env` is gitignored; `.env.example` holds only placeholders.

---

## Remediation checklist (suggested order)

Before exposing the Wisp server publicly:

- [ ] **#1** SSRF egress guard (block internal/loopback/link-local/metadata; re-check resolved IP) — Node + Worker dialers
- [ ] **#2** Fail-closed auth in production (refuse to start open)

Soon after:

- [ ] **#3** Connection/stream caps + idle timeout + `ws` `maxPayload` (+ per-IP rate limit)
- [ ] **#4** Gate/disable UDP
- [ ] **#7** Token via subprotocol + constant-time compare

Hardening / supply chain:

- [ ] **#5** Verify the yt-dlp wheel SHA-256; self-host or pin+verify Pyodide & ffmpeg
- [ ] **#6** Pin GitHub Actions to commit SHAs
