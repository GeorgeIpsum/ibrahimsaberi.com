# wisp-server

A small, portable [Wisp](https://github.com/MercuryWorkshop/wisp-protocol) proxy that powers the networking layer of [`@local/yt-dlp-wasm`](../../packages/yt-dlp-wasm). libcurl.js (running in the browser) tunnels arbitrary TCP/TLS through a Wisp WebSocket, escaping CORS — TLS is end-to-end, so the proxy only sees ciphertext.

**One codebase, two deploy targets:** a runtime-agnostic Wisp v1 core with thin adapters for Node (a `ws` server, full TCP + UDP) and Cloudflare Workers (`cloudflare:sockets`, TCP only). It is *not* built into the website (`pnpm -F=@local/** build` skips it) — it deploys on its own.

## Layout

```
src/
  protocol.ts      Wisp v1 frame encode/decode (portable)
  connection.ts    stream multiplexing + flow control over one WS (portable)
  transport.ts     ClientSink / Dialer / StreamSocket seams
  auth.ts          optional WISP_TOKEN + ALLOWED_ORIGINS (portable)
  config.ts        env -> config (portable)
  node/            http + ws server, node:net/dgram dialer
  worker/          fetch handler, WebSocketPair, cloudflare:sockets dialer
```

The portable files use only `Uint8Array` / `DataView` / `TextEncoder` / `Map`, so they compile and run unchanged on both runtimes.

## Run locally (Node)

```sh
pnpm -F wisp-server dev          # tsx watch on :6001
# or built:
pnpm -F wisp-server build && pnpm -F wisp-server start
```

Point the browser at it. For this repo's `/yt-dlp-test` route, set the endpoint
via env (it defaults to the public demo when unset — see `.env.example`):

```sh
# .env
NEXT_PUBLIC_WISP_URL=ws://localhost:6001/
# NEXT_PUBLIC_WISP_TOKEN=…   # only if the server sets WISP_TOKEN
```

Or pass it straight to the package anywhere else:

```ts
createYtDlp({ wispUrl: "ws://localhost:6001/" /* , ... */ });
```

## Configuration (env)

| Var | Default | Meaning |
| --- | --- | --- |
| `PORT` | `6001` | Listen port (Node only). |
| `WISP_TOKEN` | _unset_ | If set, clients must send it as `?token=` or the first WS subprotocol. |
| `ALLOWED_ORIGINS` | _unset_ | Comma-separated `Origin` allow-list. If unset, any origin is allowed. |
| `WISP_BUFFER_SIZE` | `128` | Per-stream flow-control window (DATA packets). |
| `WISP_MAX_STREAMS` | `512` | Max concurrent streams per connection. |
| `WISP_ALLOW_OPEN` | _unset_ | Set to `1` to allow serving open in production (overrides fail-closed). Do not use publicly. |
| `WISP_UDP_ENABLED` | _unset_ | Set to `1` to allow UDP CONNECT streams (relay/amplification risk). Default: UDP is rejected. |
| `WISP_MAX_CONNECTIONS` | `256` | Global concurrent WebSocket connection cap (Node). |
| `WISP_MAX_CONNECTIONS_PER_IP` | `16` | Per-remote-IP concurrent connection cap (Node). |
| `WISP_CONNECT_RATE_PER_MIN` | `120` | Per-IP new-connection rate limit (Node). |
| `WISP_IDLE_TIMEOUT_MS` | `120000` | Close a connection after this long with no inbound frame. |
| `WISP_MAX_LIFETIME_MS` | `3600000` | Hard cap on a single connection's lifetime. |
| `WISP_MAX_PAYLOAD` | `1048576` | Largest single WebSocket frame accepted (bytes). |

> ⚠️ A Wisp endpoint is an **open TCP proxy**. In production (`NODE_ENV=production`) the Node server **refuses to start** with neither `WISP_TOKEN` nor `ALLOWED_ORIGINS` set; the Worker (keyed on `ENVIRONMENT=production`) returns `503`. Set one, or — not recommended — `WISP_ALLOW_OPEN=1`. UDP is **off by default**; enable only behind an allow-list/trusted clients.

## Deploy as a Node service (Docker / VPS / Fly / Render)

```sh
docker build -t wisp-server services/wisp-server
docker run -p 6001:6001 -e WISP_TOKEN=… -e ALLOWED_ORIGINS=https://ibrahimsaberi.com wisp-server
```

The image bundles to a single file (no `node_modules`); full TCP + UDP. Put it behind TLS (a reverse proxy or the platform's HTTPS) and connect with `wss://`.

## Deploy as a Cloudflare Worker

```sh
cd services/wisp-server
npx wrangler dev        # local
npx wrangler deploy     # publish
npx wrangler secret put WISP_TOKEN   # optional auth
```

Cheapest option (generous free tier, no egress fees), but **TCP only** — UDP CONNECTs are rejected with Wisp close `0x41` — and subject to Workers' CPU/duration/memory limits (large downloads buffer in Worker memory since there's no WS backpressure signal). Use the Node target for heavy or UDP workloads.

**CI:** `.github/workflows/deploy-wisp.yml` typechecks + tests, then deploys on push to `main` (or via manual dispatch). Set the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets. A companion `upload-assets-r2.yml` builds the browser package + fetches the yt-dlp wheel and syncs both to an R2 bucket (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` secrets, `R2_BUCKET` variable).

**Least-privilege `CLOUDFLARE_API_TOKEN`:** this Worker has no bindings (KV/R2/D1/DO) and no custom routes, so a Custom Token with **Account › Workers Scripts › Edit** — scoped to your single account (Account Resources → Include → that account) — is sufficient. No Zone permissions, no User permissions, and (because the workflow passes `CLOUDFLARE_ACCOUNT_ID`) no Account Settings:Read. Skip the broad "Edit Cloudflare Workers" template. Add a resource's Edit permission only if you later add that binding, and Zone › Workers Routes › Edit + Zone:Read only if you add a custom route.

## Security posture

The Wisp server dials arbitrary destinations for connecting clients, so it ships with these controls (see `plans/security/yt-dlp.md`):

- **Egress guard (SSRF):** loopback, link-local, RFC1918, unique-local, `0.0.0.0/8`, and the cloud metadata IP `169.254.169.254` are refused. The Node target resolves the hostname, rejects if *any* address is internal, and **pins** the connection to the validated IP (DNS-rebinding defense). The Worker blocks literal internal IPs (it can't resolve pre-connect, but has no host network/metadata to reach). Blocked dials return Wisp `CLOSE 0x48`.
- **Fail-closed auth:** production refuses to serve open (see the warning above).
- **DoS limits (Node):** global + per-IP connection caps, a per-IP connect rate limit, an idle timeout, a max lifetime, and a `ws` `maxPayload` frame ceiling.
- **UDP is off by default** (reflection/amplification risk); enable with `WISP_UDP_ENABLED=1`.
- **Token handling:** prefer the WebSocket **subprotocol** to carry the token — the `?token=` query param leaks into access logs, browser history, and referrers. The token is compared in constant time.

### Deployment caveats (defense-in-depth)

- **`ALLOWED_ORIGINS` is not authentication.** `Origin` is only honored by browsers; a non-browser attacker sets it freely. Treat it as CSRF-style hardening — `WISP_TOKEN` (or a network ACL) is the real gate.
- **Deploy behind TLS (`wss://`).** Without it, the `CONNECT` target host:port and any token travel in plaintext on the WebSocket hop. (The tunneled payload stays end-to-end-encrypted because libcurl.js terminates TLS in the browser.)
- **The proxy operator sees every `CONNECT` host:port** even with end-to-end TLS. Expected for a proxy — note it in your privacy posture.

## Protocol notes

Implements Wisp **v1**: frames are `[type:u8][streamId:u32 LE][payload]`; `CONNECT 0x01` / `DATA 0x02` / `CONTINUE 0x03` / `CLOSE 0x04`. On connect the server sends `CONTINUE` on stream `0` advertising the window, then replenishes per-stream `CONTINUE`s as TCP DATA flows. Server→client volume respects WebSocket backpressure (Node pauses the destination socket above 1 MiB buffered).

## Test

```sh
pnpm -F wisp-server test         # vitest: protocol framing + connection behavior
pnpm -F wisp-server typecheck    # tsc for both the Node and Worker tsconfigs
```
