# yt-dlp-wasm — Phase 4 Implementation Plan (networking: libcurl.js over Wisp)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** yt-dlp's HTTP(S) requests escape the browser via **libcurl.js over a Wisp WebSocket proxy** — CORS-free. A custom yt-dlp `RequestHandler` routes `_send()` through the SAB bridge to a main-thread libcurl.js adapter, which performs the request over Wisp and returns status + headers + body. This is the piece that makes real extraction work.

**Architecture:** Builds on Phases 1–3. One new opcode `NET_SEND` flows over the existing SAB bridge to the main-thread responder (Phase 3 moved it there). The adapter runs `libcurl.fetch(url, opts)` (loaded from CDN at runtime, like Pyodide), buffers the response body into the existing `FileStore`, and returns `{status, headers, url, bodyKey}`; the Python side pulls the body via the existing chunked `FS_GET`. A Python `WispRH(RequestHandler)` is registered with yt-dlp and forced to be the only handler (urllib would CORS-fail). The capstone proves CORS-free fetch through the public Wisp demo server.

**Tech Stack:** libcurl.js 0.7.4 (Fetch-compatible WASM curl over Wisp; loaded from jsDelivr at runtime), Pyodide + yt-dlp (Phases 2–3), the SAB bridge + frame codec + FileStore (Phases 1–3), Vitest (pure units), Playwright MCP (capstone). Spec: `plans/superpowers/specs/2026-06-19-yt-dlp-wasm-design.md`. Prereq: Phases 1–3 usable.

**Verified facts** (checked against installed packages before writing):
- libcurl.js API: `await libcurl.load_wasm()` → `libcurl.set_websocket(wispUrl)` → `libcurl.fetch(url, {method, headers, body})` returns a Fetch `Response` (CORS-free; has `.status`, `.url`, `.raw_headers`, `.arrayBuffer()`). Works on the main thread. The `libcurl_full.mjs` build inlines the WASM.
- yt-dlp (2026.6.9) networking: `from yt_dlp.networking.common import RequestHandler, register_rh`; `from yt_dlp.networking import Request, Response`; `RequestHandler.__init__(self, logger, verbose=False)`, subclass implements `_send(self, request) -> Response`, class attrs `_SUPPORTED_URL_SCHEMES`; `Response(fp: io.IOBase, url, headers: Mapping[str,str], status=200, reason=None)`.
- Public Wisp demo server `wss://wisp.mercurywork.shop/` is reachable (HTTP 200).

**Scope:** Proves CORS-free networking end-to-end: a custom `RequestHandler` fetching a real URL through libcurl.js/Wisp. The response body is **buffered** (not streamed) — fine for extraction (small pages); true streaming for large downloads is deferred (and large downloads also need the ffmpeg path, which is env-blocked). YouTube specifically may still be blocked by its bot defenses (nsig/PO tokens) — out of scope, an arms race independent of this package; the smoke uses an easy target.

---

## Key risks

1. **yt-dlp RequestHandler wiring** (highest risk). Registering `WispRH` and forcing yt-dlp to use ONLY it (so urllib, which CORS-fails, isn't chosen). The exact director-replacement API (`ydl.build_request_director([WispRH])` vs. mutating `ydl._request_director`) must be verified against the installed yt-dlp in Pyodide. **Mitigation:** the capstone's PRIMARY gate is a *raw* `net.net_send()` fetch through the bridge (proves libcurl/Wisp, no yt-dlp RH involved); `extractInfo` via the RH is the secondary gate.
2. **libcurl.js WASM in this automation browser.** Phase 3's ffmpeg.wasm hung here. libcurl.js is a different, smaller Emscripten module and Pyodide's WASM works here, so it'll *probably* load — but if it hangs like ffmpeg, the raw-fetch smoke will reveal it; you'd then verify in a real browser (same as Phase 3).
3. **Wisp server.** The capstone uses the public demo `wss://wisp.mercurywork.shop/` (demo/testing only — shared, rate-limited, routes traffic through a third party). Production needs a self-hosted Wisp endpoint (per the spec's standalone-service decision).
4. **Body buffering.** The whole response is buffered in the FileStore + transferred. Fine for extraction; large media is a deferred streaming concern (and blocked on ffmpeg anyway).

---

## File Structure (Phase 4)

| File | Responsibility | New/Changed |
| --- | --- | --- |
| `src/client/protocol.ts` | Add `NET_SEND` opcode | changed |
| `src/services-worker/config.ts` | Add `NetConfig { wispUrl? }` | changed |
| `src/services-worker/net.ts` | libcurl.js adapter (CDN load, fetch → FileStore body) | new |
| `src/services-worker/responder.ts` | Dispatch `NET_SEND`; thread net+ffmpeg config | changed |
| `src/client/controller.ts` | `wispUrl` in config; `netFetch()` + `extractInfo()` | changed |
| `src/pyodide-worker/py/net.py` | Python `net_send()` over the bridge | new |
| `src/pyodide-worker/py/network_handler.py` | `WispRH(RequestHandler)` + force-handler helper | new |
| `src/pyodide-worker/worker.ts` | `net-fetch` + `extract-info` message handlers | changed |
| `src/pyodide-worker/boot.ts` | Write net.py/network_handler.py to sys.path | changed |
| `src/app/yt-dlp-test/page.tsx` | "Fetch via Wisp" + "Extract info" panels | changed |

---

## Task 1: NET_SEND opcode + libcurl.js adapter + config

No unit test for the adapter (needs libcurl WASM at runtime); a tiny pure test optional. Verified by the Task-3 smoke.

**Files:**
- Modify: `src/client/protocol.ts` — add `NET_SEND: 7` to `OP`.
- Modify: `src/services-worker/config.ts` — add:
```ts
export interface NetConfig {
  /** Wisp WebSocket proxy URL for libcurl.js (required for networking). */
  wispUrl?: string;
}
```
- Create: `src/services-worker/net.ts`:

```ts
import { encodeFrame, type DecodedFrame } from "../bridge/frame";
import type { FileStore } from "./file-store";

// libcurl.js (Fetch-compatible WASM curl over a Wisp WebSocket proxy), loaded
// from the CDN at runtime (computed specifier keeps the bundler from touching
// the Emscripten module). The `libcurl_full.mjs` build inlines the WASM.
const LIBCURL_URL =
  "https://cdn.jsdelivr.net/npm/libcurl.js@0.7.4/libcurl_full.mjs";

interface Libcurl {
  load_wasm: (url?: string) => Promise<void>;
  set_websocket: (url: string) => void;
  fetch: (url: string, opts?: unknown) => Promise<Response & { raw_headers?: [string, string][] }>;
}

let libcurlReady: Promise<Libcurl> | undefined;

async function ensureLibcurl(wispUrl: string): Promise<Libcurl> {
  if (!wispUrl) throw new Error("wispUrl is not configured");
  if (!libcurlReady) {
    libcurlReady = (async () => {
      const mod = (await import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */ LIBCURL_URL
      )) as { libcurl: Libcurl };
      const libcurl = mod.libcurl;
      await libcurl.load_wasm();
      libcurl.set_websocket(wispUrl);
      return libcurl;
    })();
  }
  return libcurlReady;
}

export interface NetSendMeta {
  method: string;
  url: string;
  headers: [string, string][];
  bodyKey?: string;
}

let netSeq = 0;

/** Perform an HTTP request via libcurl.js/Wisp; buffer the body into the store. */
export async function netSend(
  store: FileStore,
  frame: DecodedFrame<NetSendMeta>,
  wispUrl: string,
): Promise<Uint8Array> {
  const { method, url, headers, bodyKey } = frame.meta;
  const libcurl = await ensureLibcurl(wispUrl);
  const body = bodyKey ? store.raw(bodyKey) : undefined;
  const resp = await libcurl.fetch(url, {
    method,
    headers,
    body,
    redirect: "follow",
  });
  const buf = new Uint8Array(await resp.arrayBuffer());
  const responseKey = `__net_${++netSeq}`;
  store.set(responseKey, buf);
  const rawHeaders: [string, string][] =
    resp.raw_headers ?? [...resp.headers.entries()];
  return encodeFrame({
    status: resp.status,
    url: resp.url,
    headers: rawHeaders,
    bodyKey: responseKey,
  });
}
```

- Modify: `src/services-worker/responder.ts` — broaden the config type and add the dispatch case:
  - Change the signature to `export function createResponder(sab: SharedArrayBuffer, config: FfmpegConfig & NetConfig = {}): SabResponder` (import `NetConfig`, keep `FfmpegConfig`).
  - Add the case (and import `type NetSendMeta`, `netSend` from `./net`):
```ts
      case OP.NET_SEND:
        return netSend(store, decodeFrame<NetSendMeta>(payload), config.wispUrl ?? "");
```
  - Keep passing `config` to `runFfmpeg(store, ..., config)` (FfmpegConfig fields still read).

- [x] **Build/typecheck/lint/test** all green; `pnpm -F @local/yt-dlp-wasm test` still passes (22). Confirm typecheck clean.

- [x] **Commit**
```bash
git add packages/yt-dlp-wasm/src/client/protocol.ts packages/yt-dlp-wasm/src/services-worker/config.ts packages/yt-dlp-wasm/src/services-worker/net.ts packages/yt-dlp-wasm/src/services-worker/responder.ts
git commit -m "feat(yt-dlp-wasm): NET_SEND op + libcurl.js/Wisp adapter"
```

---

## Task 2: Python net bridge + yt-dlp RequestHandler

No unit test; verified by the Task-3 smoke. The RH wiring is the high-risk area — write best-effort, the smoke + browser inspection confirm.

**Files:**
- Create: `src/pyodide-worker/py/net.py`:
```python
"""Raw HTTP over the JS bridge (libcurl.js/Wisp). Returns (status, headers, url, body)."""

import fs

OP_NET_SEND = 7


def net_send(method: str, url: str, headers, body: bytes = b""):
    body_key = None
    if body:
        body_key = "__reqbody"
        fs.put_file(body_key, body)
    # headers: list of [name, value] pairs
    hdr_pairs = list(headers.items()) if hasattr(headers, "items") else list(headers)
    rmeta, _ = fs.call(
        OP_NET_SEND,
        {"method": method, "url": url, "headers": hdr_pairs, "bodyKey": body_key},
    )
    if body_key:
        fs.delete_file(body_key)
    data = fs.get_file(rmeta["bodyKey"])
    fs.delete_file(rmeta["bodyKey"])
    return rmeta["status"], rmeta["headers"], rmeta["url"], data
```

- Create: `src/pyodide-worker/py/network_handler.py`:
```python
"""A yt-dlp RequestHandler that routes requests through libcurl.js/Wisp via the bridge."""

import io

import net
from yt_dlp.networking import Response
from yt_dlp.networking.common import RequestHandler, register_rh
from yt_dlp.networking.exceptions import TransportError


@register_rh
class WispRH(RequestHandler):
    RH_NAME = "wisp"
    _SUPPORTED_URL_SCHEMES = ("http", "https")
    _SUPPORTED_PROXY_SCHEMES = None
    _SUPPORTED_FEATURES = ()

    def _send(self, request):
        data = request.data
        if data is not None and not isinstance(data, (bytes, bytearray)):
            data = data.read()
        try:
            status, headers, final_url, body = net.net_send(
                request.method, request.url, request.headers, data or b"",
            )
        except Exception as e:
            raise TransportError(cause=e) from e
        # headers is a list of [name, value]; Response takes a Mapping, so fold
        # to a dict (last value wins — acceptable for extraction).
        header_map = {}
        for name, value in headers:
            header_map[name] = value
        return Response(
            fp=io.BytesIO(body), url=final_url, headers=header_map, status=status,
        )


def use_only_wisp(ydl):
    """Force a YoutubeDL instance to route all requests through WispRH.

    urllib/requests would fail under the browser's CORS, so they must not be
    selected. Replace the request director's handlers with only WispRH.
    """
    director = ydl.build_request_director([WispRH])
    ydl._request_director = director
```

- Modify: `src/pyodide-worker/boot.ts` — add the two `.py` imports and include them in the shim-install block written to `/tmp/ytdlp_py` (so `import net`, `import network_handler` resolve). i.e. extend the `_mods`/loop that already writes `fs`/`ffprobe_compat`/`subprocess_shim` to ALSO write `net` and `network_handler`. (Do NOT auto-run `use_only_wisp` at boot — it's applied per-YoutubeDL in the extract handler.)

- [x] **Build/typecheck/lint/test** green; confirm the new modules are inlined: `grep -c "WispRH" packages/yt-dlp-wasm/dist/pyodide-worker/worker.js` ≥ 1.

- [x] **Commit**
```bash
git add packages/yt-dlp-wasm/src/pyodide-worker/py/net.py packages/yt-dlp-wasm/src/pyodide-worker/py/network_handler.py packages/yt-dlp-wasm/src/pyodide-worker/boot.ts
git commit -m "feat(yt-dlp-wasm): python net bridge + WispRH request handler"
```

---

## Task 3: Capstone — fetch through Wisp (+ extractInfo)

**Files:**
- Modify: `src/pyodide-worker/worker.ts` — add two handlers (same `runtime` guard + try/catch pattern as `handlePyEcho`):
  - `net-fetch` (PRIMARY gate — raw, no yt-dlp RH):
```ts
  } else if (msg?.type === "net-fetch") {
    void handleNetFetch(msg.url as string);
  }
```
```ts
async function handleNetFetch(url: string): Promise<void> {
  try {
    if (!runtime) throw new Error("net-fetch before init");
    const { pyodide } = await runtime;
    pyodide.globals.set("_net_url", url);
    const result = pyodide.runPython(`
import json, net
_status, _headers, _final, _body = net.net_send("GET", _net_url, {})
json.dumps({"status": _status, "size": len(_body), "preview": _body[:200].decode("utf-8", "replace")})
`) as string;
    self.postMessage({ type: "net-fetch-result", text: result });
  } catch (err) {
    self.postMessage({ type: "net-fetch-result", error: messageOf(err) });
  }
}
```
  - `extract-info` (secondary gate — via the RH):
```ts
  } else if (msg?.type === "extract-info") {
    void handleExtractInfo(msg.url as string);
  }
```
```ts
async function handleExtractInfo(url: string): Promise<void> {
  try {
    if (!runtime) throw new Error("extract-info before init");
    const { pyodide } = await runtime;
    pyodide.globals.set("_xi_url", url);
    const result = await pyodide.runPythonAsync(`
import json, yt_dlp, network_handler
_ydl = yt_dlp.YoutubeDL({"quiet": True, "skip_download": True, "noplaylist": True})
network_handler.use_only_wisp(_ydl)
_info = _ydl.extract_info(_xi_url, download=False)
_clean = _ydl.sanitize_info(_info)
json.dumps({"title": _clean.get("title"), "ext": _clean.get("ext"), "id": _clean.get("id"), "extractor": _clean.get("extractor")})
`) as string;
    self.postMessage({ type: "extract-info-result", text: result });
  } catch (err) {
    self.postMessage({ type: "extract-info-result", error: messageOf(err) });
  }
}
```

- Modify: `src/client/controller.ts` — add `wispUrl` to config and two methods:
  - `YtDlpConfig` already extends `PyodideBootConfig, FfmpegConfig`; add `NetConfig` (import it): `extends PyodideBootConfig, FfmpegConfig, NetConfig`.
  - Add to the `YtDlp` interface + returned object (via `once`):
```ts
  netFetch(url: string): Promise<{ status: number; size: number; preview: string }>;
  extractInfo(url: string): Promise<{ title: string | null; ext: string | null; id: string | null; extractor: string | null }>;
```
```ts
    netFetch: (url) =>
      once("net-fetch-result", () => pyodideWorker.postMessage({ type: "net-fetch", url }), (d) => JSON.parse(d.text as string)),
    extractInfo: (url) =>
      once("extract-info-result", () => pyodideWorker.postMessage({ type: "extract-info", url }), (d) => JSON.parse(d.text as string)),
```
  (No controller change needed for `wispUrl` plumbing beyond config — `rest` already flows to `createResponder`, which now reads `config.wispUrl`.)

- Modify: `src/app/yt-dlp-test/page.tsx` — add a "Networking (Wisp)" section: an input for a URL (default a small text URL e.g. `https://example.com/`), a **Fetch via Wisp** button calling `netFetch`, and an **Extract info** button calling `extractInfo`. Construct the client with the public demo Wisp server:
```ts
const ytdlp = createYtDlp({ wispUrl: "wss://wisp.mercurywork.shop/", ytDlpSource: { url: wheelUrl } });
```
(reuse the wheel-manifest fetch from the existing boot panel). Update the `YtDlpHandle` cast type to include `netFetch`/`extractInfo`. Render results: `✓ <status> · <size> bytes` and `✓ <title> [<extractor>]`.

- [x] **Publish + static checks** — `pnpm yt-dlp-wasm:public`; `biome check` + root `tsc --noEmit` clean; package `test` 22 pass.

- [x] **Browser smoke (the gate)** — `pnpm dev`, open `/yt-dlp-test`:
  - **Primary:** click **Fetch via Wisp** with `https://example.com/` (or a small JSON URL) → expect `✓ 200 · <N> bytes` with a sensible preview. This proves CORS-free networking through libcurl.js/Wisp end-to-end.
  - **Secondary:** click **Extract info** on an easy direct/extractor URL → expect `✓ <title>`. If the RH wiring needs adjustment, the error surfaces here; fix `use_only_wisp` against the live `ydl` (inspect `ydl._request_director` / `build_request_director` in the browser console) and re-publish.
  (Controller drives this. If libcurl.js WASM hangs like ffmpeg did, note it and verify in a real browser.)

- [x] **Commit**
```bash
git add packages/yt-dlp-wasm/src/pyodide-worker/worker.ts packages/yt-dlp-wasm/src/client/controller.ts src/app/yt-dlp-test/page.tsx
git commit -m "feat(yt-dlp-wasm): netFetch + extractInfo via Wisp on the /yt-dlp-test route"
```

---

## Self-Review (against the spec)

- **CORS escape via libcurl.js over Wisp** (spec "Networking" decision): `net.ts` adapter (`libcurl.set_websocket` + `libcurl.fetch`), `wispUrl` config. ✅
- **Custom yt-dlp RequestHandler** (spec "Networking bridge" — chosen over urllib monkeypatch): `WispRH(RequestHandler)._send` → bridge → libcurl; `use_only_wisp` forces it. ✅
- **Streaming**: response body buffered then chunked via the existing `FS_GET` (Phase 3). True streaming deferred (documented; large downloads also need the ffmpeg path). ✅ (scoped)
- **Reuses the Phase-3 chunked transfer** for the response body (no new read op — only `NET_SEND`). ✅
- **YouTube bot defenses**: explicitly out of scope (arms race); smoke uses an easy target. ✅
- **Placeholder scan:** none; the RH-wiring risk is flagged with a concrete verify step, not a placeholder.
- **Type/name consistency:** `OP.NET_SEND`, `NetSendMeta`, `netSend`, `NetConfig`, `net.net_send`, `WispRH`, `use_only_wisp`, and the worker/controller message types (`net-fetch`/`net-fetch-result`/`extract-info`/`extract-info-result`) agree across all files.

## Notes for later

- **Streaming responses** (NET_READ pulling chunks as they arrive) for large downloads — pairs with resolving the ffmpeg env blocker.
- **Self-hosted Wisp** server for production (replace the public demo) — per the spec's standalone-service decision; needs auth/rate-limiting (it proxies arbitrary TCP).
- **Opcode table** still duplicated JS (`protocol.ts`) ↔ Python (`fs.py`/`net.py` `OP_*`) — generate one from the other (flagged since Phase 2).
- TLS impersonation (libcurl.js supports per-request `proxy`/options) for sites with stricter anti-bot — revisit if needed.
