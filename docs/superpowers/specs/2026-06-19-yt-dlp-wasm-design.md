# yt-dlp-wasm — Design

**Date:** 2026-06-19
**Status:** Approved, ready for implementation

## Problem

We want to run yt-dlp **in the browser** — faithful, general-purpose behavior:
extraction, download, *and* post-processing (merging video+audio, remux, audio
extraction, thumbnail/metadata embedding). We ship the heavy runtimes (Pyodide +
ffmpeg.wasm) but **not yt-dlp itself** — yt-dlp is fetched at load time.

The package lives at `packages/yt-dlp-wasm` as `@local/yt-dlp-wasm`, a private
workspace package consumed by the Next app via `workspace:*`.

## Key constraints (these shape everything below)

1. **yt-dlp's release binaries can't run in Pyodide.** The `yt-dlp`/`yt-dlp.exe`
   release files are PyInstaller-frozen executables. What runs is yt-dlp's
   **pure-Python package** (no C extensions), fetched at load.
2. **CORS blocks everything.** yt-dlp issues HTTP via `urllib`; routed through
   the browser those cross-origin requests are blocked, and no media host sends
   permissive CORS headers. We escape via **libcurl.js over a Wisp WebSocket
   proxy** (already a dependency) — CORS-free, full header control, possible TLS
   impersonation.
3. **yt-dlp is synchronous; our bridges are async.** `urllib` requests and
   `subprocess.Popen(...).communicate()` block the calling thread, but
   libcurl-over-Wisp and `ffmpeg.exec()` are async. We can't make yt-dlp's deep
   sync call stack `await`. Resolved with **`SharedArrayBuffer` + `Atomics.wait`**:
   the Pyodide thread parks on `Atomics.wait` while another thread does the async
   work and signals completion. SAB requires cross-origin isolation — which the
   multi-threaded ffmpeg core requires anyway, so it lines up. `Atomics.wait` is
   illegal on the main thread → Pyodide must live in a Worker.
4. **No subprocess in Pyodide.** yt-dlp shells out to `ffmpeg`/`ffprobe`. Those
   calls are intercepted and routed into ffmpeg.wasm. Since ffmpeg.wasm *is* real
   ffmpeg, faithfully passing argv and capturing real stderr/stdout keeps
   yt-dlp's output parsing working unchanged.

## Architecture: three contexts

Approach A — each unit has one job, communicates over one typed interface
(`protocol.ts`), and is independently testable.

| Context | Job | Blocks? |
| --- | --- | --- |
| **Main thread** (`client/`) | Public API, spawns workers, owns the SAB, relays `progress`/`log` events | Never |
| **Pyodide worker** | Runs *real* yt-dlp; its network/ffmpeg calls look sync, park on `Atomics.wait` under the hood | Yes (allowed — not main thread) |
| **Services worker** | Runs the async engines: libcurl.js (Wisp) + ffmpeg.wasm (MT core); does I/O, writes results to SAB, `Atomics.notify`s Pyodide awake | No |

The blocked Pyodide thread cannot also drive the WebSocket / ffmpeg event loop —
hence the *separate* services worker. (Two-context designs collapse back into
this once you account for that. An async-rewrap of yt-dlp was rejected: enormous,
brittle, defeats faithfulness.)

## Layout

```
packages/yt-dlp-wasm/
  src/
    index.ts                # public API: createYtDlp() + types
    client/
      controller.ts         # spawns workers, owns SAB, event emitter
      protocol.ts           # typed messages + SAB layout (shared by all 3)
    pyodide-worker/
      worker.ts             # boots Pyodide, loads yt-dlp, installs shims, blocks on Atomics
      py/                   # Python glue (authored as .py, inlined at build)
        network_handler.py  # custom yt-dlp RequestHandler -> JS bridge
        subprocess_shim.py  # Popen/run/check_output shim for ffmpeg/ffprobe
        ffprobe_compat.py   # synthesize ffprobe JSON from `ffmpeg -i` stderr
    services-worker/
      worker.ts             # libcurl.js Wisp client + ffmpeg.wasm host
      net.ts                # streaming HTTP over libcurl
      ffmpeg.ts             # exec + cross-FS file staging
    bridge/
      sab.ts                # SharedArrayBuffer ring + Atomics encode/decode
  package.json
  tsconfig.json
```

## The sync bridge — `bridge/sab.ts`

A `SharedArrayBuffer` with a control region (`Int32Array`: state + length +
request-id) and a data region (`Uint8Array`). Per call:

1. Pyodide worker writes the request (op + args) to the data region, sets state
   `PENDING`, posts a wakeup to the services worker, `Atomics.wait`s on the
   control word.
2. Services worker performs the async work, writes the response bytes, sets state
   `DONE`, `Atomics.notify`.
3. Pyodide worker wakes, reads the result.

Payloads exceeding the data region are **chunked**: the services worker holds the
full buffer, Pyodide pulls fixed-size chunks via repeated `read(reqId, offset, n)`
calls. This is how streaming downloads avoid buffering a whole body in the control
channel.

Decision deferred to implementation: hand-roll the Atomics protocol (leaning this,
to avoid a dep and keep it explicit) vs. adopt `coincident`/`sabreadwritesync`.

## Networking bridge — `network_handler.py` ↔ `services-worker/net.ts`

Register a **custom yt-dlp `RequestHandler`** (not a urllib monkeypatch). Its
`_send(request)` serializes method/url/headers/body, calls the sync bridge, and
reconstructs a yt-dlp `Response`. The services worker performs the request with
**libcurl.js over Wisp** — real redirects, full header control, TLS impersonation
where libcurl.js supports it, all CORS-free.

Response bodies **stream**: each `response.read(n)` maps to a chunked SAB pull from
a buffer the services worker fills off the libcurl stream. Downloaded bytes land
in Pyodide's MEMFS exactly as native yt-dlp expects.

## ffmpeg bridge — `subprocess_shim.py` + `ffprobe_compat.py` ↔ `services-worker/ffmpeg.ts`

`subprocess_shim.py` replaces `Popen`/`run`/`check_output`. If `argv[0]`'s
basename is `ffmpeg`/`ffprobe`, route through the sync bridge and return a
faithful fake process (`returncode`, captured `stdout`/`stderr`, working
`communicate()`); anything else raises. `-version` is special-cased to return a
synthetic banner so yt-dlp's availability probe passes.

`services-worker/ffmpeg.ts` stages files across filesystems: read named inputs
from Pyodide MEMFS (shipped over the bridge), write them into ffmpeg.wasm's FS,
`exec(argv)`, copy outputs back into MEMFS. Real ffmpeg stderr flows back so
yt-dlp's progress parsing works unchanged.

**ffprobe compat:** the `@ffmpeg/core` build ships *ffmpeg only, not ffprobe*. So
`ffprobe_compat.py` synthesizes the `-show_streams -show_format -of json` output
yt-dlp consumes, by parsing real `ffmpeg -i` stderr for the fields yt-dlp reads
(codec, duration, dimensions, etc.). Unrecoverable fields → yt-dlp degrades
gracefully (same as a partial probe). A custom ffprobe-included core is a possible
later upgrade.

## Loading sequence

`createYtDlp(config)` → `await ytdlp.load()`:

1. Main thread spawns both workers, allocates the SAB, hands each worker its view.
2. **Pyodide worker:** load Pyodide (`pyodideIndexURL`), load yt-dlp (`ytDlpSource`,
   default `micropip.install('yt-dlp')`), install the three shims, register the
   custom `RequestHandler`.
3. **Services worker:** init ffmpeg.wasm (MT core from `ffmpegCoreURL`), open the
   libcurl.js connection to `wispUrl`.
4. Resolve when all three ready → `ready`.

## Public API — `src/index.ts`

```ts
const ytdlp = createYtDlp({
  wispUrl: "wss://…",                   // required — your Wisp server
  ytDlpSource?: "micropip" | { url },   // default micropip/PyPI
  pyodideIndexURL?, ffmpegCoreURL?,     // default: self-hosted asset paths
  core?: "mt" | "st",                   // default "mt"
});

await ytdlp.load();
ytdlp.on("progress", p => …);  // {stage:"download"|"postprocess", percent, speed, eta, file}
ytdlp.on("log", l => …);       // yt-dlp + ffmpeg stderr lines

const info   = await ytdlp.extractInfo(url, { flatPlaylist? }); // structured JSON, no download
const result = await ytdlp.exec(argv);  // faithful CLI: yt_dlp.main(argv) → {exitCode, files[], logs}
const blob   = await ytdlp.download(url, { format, outputTemplate, … }); // convenience → final Blob

ytdlp.terminate();
```

Two layers, same engine: `extractInfo`/`download` use yt-dlp's **Python
`YoutubeDL` API** (clean structured data + native `progress_hooks`); `exec(argv)`
runs the **real CLI entrypoint** for full faithfulness. Output files are read out
of the MEMFS working dir (`/work`) after the run and returned as `{ name, data }`.

## Host-app requirements

- **Cross-origin isolation** — `next.config.ts` must send `COOP: same-origin` +
  `COEP: require-corp` on pages using the package (for SAB + the MT core). Can
  break third-party embeds/images on those pages unless they're CORP/CORS-clean.
- **Asset hosting under COEP** — Pyodide, the ffmpeg MT core, and the yt-dlp wheel
  must each be CORP/CORS-loadable. Recommendation: **self-host Pyodide + ffmpeg
  core** under same-origin `public/`; yt-dlp via micropip from jsDelivr (sends
  CORP) with a self-host fallback via `ytDlpSource`.
- **A Wisp server** — libcurl.js needs one. Vercel can't host a persistent
  WebSocket server, so this must be an external/self-hosted Wisp endpoint
  (`wispUrl`).

## Build & deps

- **Build:** esbuild (already in `onlyBuiltDependencies`) — bundles the three entry
  points (main + 2 workers) and inlines `py/*.py` as string modules; `.d.ts` via
  `tsc --emitDeclarationOnly`. Worker URLs use
  `new Worker(new URL("./worker.js", import.meta.url))` so the consuming
  Next/Turbopack build wires them up. (This deviates from the bare-`tsc` build the
  trivial `rehype-*` packages use, justified by workers + Python inlining.)
- **Runtime deps:** `pyodide`, `@ffmpeg/ffmpeg` + `@ffmpeg/core-mt` + `@ffmpeg/util`,
  `libcurl.js` (present). No Comlink (hand-rolled protocol).

## Testing

- **Unit (vitest):** SAB encode/decode + chunking; ffmpeg argv translation; the
  ffprobe-JSON synthesizer (sample `ffmpeg -i` stderr → expected JSON). The
  brittle bits, all pure functions.
- **Contract:** drive the services worker with **fixtures** (recorded HTTP
  responses), no Pyodide — deterministic extraction tests. The bridge seam makes
  the transport swappable.
- **E2E smoke (Playwright, gated/manual):** one short real video end-to-end through
  a real Wisp server. Not in default CI (needs network + WS).

## Risks / open questions

- **YouTube bot defenses** — even with perfect networking, YouTube needs `nsig`
  deobfuscation (yt-dlp's JS interpreter; runs in Pyodide) and increasingly **PO
  tokens**. An ongoing arms race *independent of this package* — we deliver
  faithful yt-dlp behavior, but YouTube specifically may still block. Other sites
  are generally easier.
- **Memory** — media is fully buffered in the wasm heap (MEMFS); large/long videos
  can OOM. Mitigation is format/size guidance, not a true fix. Document sane
  defaults.
- **TLS impersonation** — depends on what libcurl.js exposes; without it, some
  sites' anti-bot will reject requests.
- **yt-dlp version drift** — the hybrid shim is version-tolerant, but a major
  yt-dlp refactor of its networking/PP layer could need shim updates. The
  `ytDlpSource` pin controls upgrade timing.
- **ffprobe** — synthesized JSON is best-effort; exotic probe-dependent paths
  degrade.

## Out of scope (YAGNI)

- A UI for the package (it's a library; the app builds UI on top).
- Single-threaded-core deploy path beyond the `core: "st"` config flag (MT is the
  target; ST left as an escape hatch, not separately optimized).
- A bundled Wisp server (consumers point at their own `wispUrl`).
- Custom ffprobe-included ffmpeg core (noted as a later upgrade, not built now).
- Upload/livestream-DVR/auth-cookie flows beyond what yt-dlp does out of the box.
