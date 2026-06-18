# Network Quality API — Design

**Date:** 2026-06-18
**Status:** Approved, ready for implementation

## Problem

`src/hooks/use-network-quality.ts` measures connection quality by pinging
Google's favicon and downloading a multi‑megabyte Wikipedia image. That wastes
bytes (especially bad on the slow/metered connections the hook exists to
detect) and depends on third‑party hosts. We want our own same‑origin route(s)
that measure **download speed + ping** while transferring as few bytes as the
decision actually requires.

## Key constraint

You cannot measure high bandwidth without transferring bytes roughly
proportional to that bandwidth: a tiny download on a fast link just measures
latency, not throughput. The hook only needs a coarse **slow vs. good**
classification at a ~2 Mbps threshold, so "minimize bytes" means "transfer only
as many bytes as that decision needs."

## Strategy: time‑boxed streaming with a byte ceiling

The download measurement reads a stream until **`windowMs` elapsed OR `capBytes`
received, whichever comes first.**

| Connection | Governed by | Bytes pulled |
| --- | --- | --- |
| 2 Mbps (slow, often metered) | time window | ~200 KB |
| 50 Mbps | time window | ~5 MB |
| 1 Gbps | **byte cap** | ~3 MB, stops in ~25 ms |

The cap bounds fast links (where pure time‑boxing would pull ~100 MB) — exactly
the connections that resolve to "good" instantly anyway. Slow/metered links only
ever pull a couple hundred KB. Defaults: **window 800 ms, cap 3 MB.**

The cap is the better byte‑reduction lever than the window. Shrinking the window
saves bytes only on slow links (~200 KB → marginal) while degrading accuracy
where it matters most (TCP slow‑start contamination + noise near the threshold).
Shrinking the cap saves real bytes on fast links and only costs accuracy of the
*reported number*, not the slow/good classification.

## Routes — `src/app/api/net/`

Both use `await connection()` to force dynamic rendering (codebase idiom, see
`src/app/api/health/route.ts`), Node runtime.

### `GET /api/net/ping`

Returns `204 No Content`, empty body, `Cache-Control: no-store`. Near‑zero
bytes. The client times round‑trips against it.

### `GET /api/net/down`

Streams incompressible bytes via a **pull‑based** `ReadableStream` (production
tied to consumption via `pull()`, so server output ≈ what the wire delivers; no
buffering of unsent bytes).

Query params (validated with `clampInt(raw, min, max, fallback)` — non‑numeric /
out‑of‑range / missing fall back to default, so the endpoint can't be coerced
into absurd payloads):

| Param | Meaning | Default | Clamp |
| --- | --- | --- | --- |
| `bytes` | cap — server stops emitting after this many bytes | `3145728` (3 MB) | `[1024, 67108864]` |
| `ms` | window — server stops the stream after this long (hard backstop) | `2000` | `[50, 30000]` |

Server stops at whichever bound hits first: `bytes` via a per‑pull counter, `ms`
via a `setTimeout` that closes the controller (cleared on `cancel`).

Compression defenses (a compressed stream would corrupt the measurement — the
client counts *decompressed* bytes received):

- A 256 KB buffer of `crypto`‑random bytes, generated once at module load
  (256 KB period > gzip's 32 KB back‑reference window → uncompressible by gzip).
- `Content-Type: application/octet-stream` + `Cache-Control: no-store,
  no-transform` (octet‑stream is not compressed by default; `no-transform` tells
  proxies/CDNs not to).
- No `Content-Length` → chunked transfer; the client aborts when done.

## Client measurement — `src/hooks/use-network-quality.ts`

Public API unchanged: returns `"checking" | "good" | "slow" | "offline"`. The
status machine, `failCountThreshold` debounce, interval, and online/offline
listeners all stay. Two behavioural changes plus new tunables.

**1. Sequential, not parallel.** Today ping + download run via `Promise.all`; the
download saturates the link and inflates the ping reading. Switch to
ping‑*then*‑download so each measurement is clean.

**2. Ping** — one warmup request (establishes the connection, discarded), then
`pingSamples` timed requests; take the **min** (rejects jitter).

**3. Download** — `fetch(downloadUrl?bytes={cap}&ms={windowMs + margin})`, read
`response.body`. Start the clock at the **first chunk** (excludes TTFB) and skip
that first chunk's bytes (first‑byte‑to‑last‑byte method also sheds part of TCP
slow‑start). Accumulate bytes; `reader.cancel()` at `windowMs` or `capBytes`;
`mbps = computeMbps(bytes, elapsedMs)`. The server `ms` is set above the client
window so the client always governs in normal operation. Degenerate single‑chunk
case (tiny cap) falls back to whole‑transfer timing.

New options (defaults preserve current behaviour): `pingSamples = 3`,
`downloadWindowMs = 800`, `maxDownloadBytes = 3 * 1024 * 1024`. Default
`pingUrl`/`downloadUrl` now point at `/api/net/ping` and `/api/net/down`.

## Shared helpers — `src/utils/network-quality.ts`

Pure module, no node imports (safe for client hook, server route, and tests):

- `computeMbps(bytes, ms)` → Mbps (guards `ms <= 0`).
- `clampInt(raw, min, max, fallback)` → integer.
- Default/min/max constants for `bytes` and `ms`.

## Testing — `__tests__/` (vitest, node env)

- `network-quality.test.ts` — `computeMbps` math (incl. zero‑duration guard) and
  `clampInt` (valid, out‑of‑range, non‑numeric, missing).
- `net-routes.test.ts` — partial‑mock `next/server` to stub `connection()`:
  - `ping` → status 204, `no-store`, empty body.
  - `down` → `application/octet-stream` + `no-transform` headers; draining a
    small `?bytes=` cap yields exactly that many bytes then closes; cyclic chunks
    are non‑empty; clamping behaviour delegated to the `clampInt` unit test.

## Files

- `src/utils/network-quality.ts` (new)
- `src/app/api/net/ping/route.ts` (new)
- `src/app/api/net/down/route.ts` (new)
- `src/hooks/use-network-quality.ts` (modified)
- `__tests__/network-quality.test.ts` (new)
- `__tests__/net-routes.test.ts` (new)

## Out of scope (YAGNI)

- Precise speedtest numbers / UI display of Mbps (classification only).
- Upload measurement, jitter/packet‑loss metrics.
- Edge runtime (Node matches the rest of the codebase; ping warmup absorbs cold
  start).
