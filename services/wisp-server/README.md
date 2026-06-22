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

> ⚠️ A Wisp endpoint is an **open TCP proxy**. For any public deployment set `WISP_TOKEN` and/or `ALLOWED_ORIGINS`. With neither set, the server is open (fine for local testing only).

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

## Protocol notes

Implements Wisp **v1**: frames are `[type:u8][streamId:u32 LE][payload]`; `CONNECT 0x01` / `DATA 0x02` / `CONTINUE 0x03` / `CLOSE 0x04`. On connect the server sends `CONTINUE` on stream `0` advertising the window, then replenishes per-stream `CONTINUE`s as TCP DATA flows. Server→client volume respects WebSocket backpressure (Node pauses the destination socket above 1 MiB buffered).

## Test

```sh
pnpm -F wisp-server test         # vitest: protocol framing + connection behavior
pnpm -F wisp-server typecheck    # tsc for both the Node and Worker tsconfigs
```
