# @local/yt-dlp-wasm

Run [yt-dlp](https://github.com/yt-dlp/yt-dlp) in the browser — extraction, download, and post-processing — on top of **Pyodide** (yt-dlp itself) and **ffmpeg.wasm** (post-processing), with HTTP escaping CORS via **libcurl.js over a Wisp proxy**. yt-dlp is fetched at load time; only Pyodide + ffmpeg.wasm are shipped/served.

## How it works

yt-dlp is synchronous (`urllib`, `subprocess`), but everything it must reach in a browser is async (a Wisp WebSocket, `ffmpeg.exec()`). The bridge resolves that with a `SharedArrayBuffer` + `Atomics.wait`:

```
┌─ main thread ─────────────────────────┐        ┌─ pyodide worker ──────────────┐
│ createYtDlp() controller              │        │ Pyodide + real yt-dlp         │
│ SAB responder (never blocks):         │  SAB   │ SabRequester.call() parks on  │
│  • FileStore (cross-FS staging)       │◀──────▶│  Atomics.wait (it MAY block)  │
│  • ffmpeg.wasm  (FFMPEG_EXEC)         │ + wake │ custom RequestHandler (WispRH)│
│  • libcurl.js → Wisp  (NET_SEND)      │  msg   │ subprocess shim → ffmpeg      │
└───────────────────────────────────────┘        └───────────────────────────────┘
```

- The **Pyodide worker** runs yt-dlp. Its blocking `urllib`/`subprocess` calls go through a sync bridge call that parks the worker thread on `Atomics.wait`.
- The **SAB responder runs on the main thread** (it never blocks — only the requester does), where ffmpeg.wasm and libcurl.js load reliably. Each bridge call is woken via a `postMessage`; the responder does the async work and `Atomics.notify`s the worker.
- A custom yt-dlp `RequestHandler` (`WispRH`) routes all HTTP through `NET_SEND` → libcurl.js over Wisp (CORS-free). The `subprocess` shim routes `ffmpeg`/`ffprobe` through `FFMPEG_EXEC` → ffmpeg.wasm (with an `ffprobe` JSON compat layer, since the core ships no ffprobe).

## Requirements (host page)

1. **Cross-origin isolation** — the page must send `COOP: same-origin` + `COEP: require-corp` (SharedArrayBuffer + the ffmpeg MT core need it). See `next.config.ts` `headers()` scoped to `/yt-dlp-test` in this repo.
2. **A Wisp server** — libcurl.js needs a Wisp WebSocket endpoint (it proxies arbitrary TCP, CORS-free). Use a self-hosted [`wisp-server-node`](https://github.com/MercuryWorkshop/wisp-server-node) (recommended; add auth/rate-limiting — it's effectively an open proxy) or the public demo `wss://wisp.mercurywork.shop/` for testing only. WebSockets are COEP-exempt, so a cross-origin Wisp endpoint is fine.
3. **Assets** — Pyodide, the ffmpeg core+wasm, and the yt-dlp wheel load from jsDelivr by default (works under COEP); all are configurable to self-host/R2. The `@ffmpeg/ffmpeg` class worker is **bundled into the package dist** (`ffmpeg-worker.js`) and must be served **same-origin** beside the package entry (it's resolved relative to `index.js` via `import.meta.url`) — see the caveat below.

## Usage

```ts
import { createYtDlp } from "@local/yt-dlp-wasm";

const ytdlp = createYtDlp({
  wispUrl: "wss://your-wisp-server/",          // required for networking
  // optional: pyodideIndexURL, ffmpegCoreBaseURL, ytDlpSource, dataCapacity
});

const { ytDlpVersion } = await ytdlp.load();   // boots Pyodide + installs yt-dlp

// metadata only (no download):
const info = await ytdlp.extractInfo("https://example.com/video");

// stream progress/log while downloading:
ytdlp.on("log", (line) => console.log(line));
ytdlp.on("progress", (p) => console.log(p.status, p.downloaded_bytes, p.total_bytes));
const { files } = await ytdlp.download("https://example.com/video", {
  format: "bv*+ba/b",
  // any YoutubeDL option, e.g. cookies, ratelimit, etc.
});
const mp4 = await ytdlp.readOutputFile(files[0].name);  // Uint8Array

// faithful CLI:
const { exitCode, stdout, stderr, files: out } = await ytdlp.exec(["--version"]);

ytdlp.terminate();
```

### API

| Method | Description |
| --- | --- |
| `load()` | Boot Pyodide + install yt-dlp; resolves `{ ytDlpVersion }`. |
| `extractInfo(url)` | Metadata only (`{ title, ext, id, extractor }`), no download. |
| `download(url, opts?)` | Run yt-dlp's `YoutubeDL` (any opts); returns `{ files: {name,size}[] }` in `/work`. Emits `progress`/`log`. |
| `exec(argv)` | Real yt-dlp CLI entrypoint; `{ exitCode, stdout, stderr, files }`. |
| `readOutputFile(name)` | Read an output file from `/work` → `Uint8Array`. |
| `on/off("log"\|"progress", cb)` | Live event stream during `download`. |
| `terminate()` | Tear down the worker. |

### Config (`YtDlpConfig`)

`wispUrl` · `ytDlpSource` (`"micropip"` \| `{ url }`) · `pyodideIndexURL` · `ffmpegCoreBaseURL` / `ffmpegClassWorkerURL` · `dataCapacity` (SAB bytes, default 16 MiB).

## Development

```sh
pnpm -F @local/yt-dlp-wasm build      # esbuild → dist/ (main + pyodide worker) + .d.ts
pnpm -F @local/yt-dlp-wasm test       # vitest (bridge / frame / file-store / events / config)
pnpm yt-dlp-wasm:public               # build + copy dist → public/yt-dlp-wasm (for the demo route)
pnpm yt-dlp-wasm:wheel                # fetch a self-hosted yt-dlp wheel → public/yt-dlp-wheels
pnpm dev                              # then open /yt-dlp-test to exercise every piece
```

`/yt-dlp-test` is a manual harness with panels for the sync bridge, Pyodide+yt-dlp, ffmpeg, Wisp networking, and the CLI/events/download API.

## Status & caveats

Verified working in-browser, including a full real `download()` end-to-end: the SAB sync bridge, Pyodide + yt-dlp load, libcurl.js-over-Wisp networking (CORS-free fetch + yt-dlp extraction running through it), `exec(["--version"])`, the live `progress`/`log` event stream, and **ffmpeg post-processing**. Confirmed against real media fetched over Wisp: a webm→mkv remux (`FFmpegVideoRemuxer`) and a wav→mp3 extract-audio (`FFmpegExtractAudio`, libmp3lame) both produce valid output files — exercising yt-dlp's executable discovery (`ffmpeg -bsfs`), `ffprobe` codec detection, and the ffmpeg encode path through the subprocess shim.

- **libcurl.js cert trust varies by host.** TLS verification happens in libcurl.js (the Wisp proxy only tunnels bytes). Some hosts fail with `error code 60: SSL peer certificate ... not OK` depending on libcurl.js's CA bundle / chain handling; others (e.g. `raw.githubusercontent.com`) work fine. This is independent of the proxy.

- **ffmpeg class worker must be same-origin.** `@ffmpeg/ffmpeg`'s published ESM worker has relative imports (`./const.js`, `./errors.js`); loading it via `toBlobURL()` makes those resolve against the blob URL and 404, so `FFmpeg.load()` hangs forever with no error. We bundle a self-contained `ffmpeg-worker.js` into the package dist and serve it same-origin (resolved via `import.meta.url`); only the self-contained core + wasm are `toBlobURL`'d. Override with `ffmpegClassWorkerURL` only with another **same-origin** URL.
- **YouTube** specifically gates shared/datacenter IPs with *"Sign in to confirm you're not a bot"* (an anti-bot arms race independent of this package — yt-dlp hits it everywhere from such IPs). The extractor *runs* fine through the bridge; YouTube rejects the IP. To make it work: pass cookies (`cookiesfrombrowser`/`cookies` opts), use a **residential-IP Wisp server**, and/or PO tokens. Non-YouTube sites and direct media URLs don't have this gate.
- **Large media** is fully buffered in memory (SAB + MEMFS); response streaming and chunked output reads are future work.
- The Wisp endpoint proxies arbitrary TCP — secure it (auth, origin allow-list, rate limits) before exposing.
