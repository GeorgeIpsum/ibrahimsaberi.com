// Self-contained build of @ffmpeg/ffmpeg's class worker.
//
// @ffmpeg/ffmpeg's published ESM worker (`dist/esm/worker.js`) has relative
// imports (`./const.js`, `./errors.js`). Loading it through `toBlobURL()` is a
// trap: a blob-URL module resolves those specifiers against the blob URL
// itself (`blob:<origin>/const.js`), which 404s, so the worker's module graph
// never loads and `FFmpeg.load()` hangs forever with no error surfaced.
//
// Bundling the worker here inlines its dependencies into one file with no
// relative imports, so it can be served same-origin (next to index.js) and
// handed to `FFmpeg.load({ classWorkerURL })` directly — no blob needed.
import "@ffmpeg/ffmpeg/worker";
