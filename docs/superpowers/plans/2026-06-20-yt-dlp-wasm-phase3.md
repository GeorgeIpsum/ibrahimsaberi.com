# yt-dlp-wasm — Phase 3 Implementation Plan (ffmpeg bridge)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Route yt-dlp's `ffmpeg`/`ffprobe` subprocess calls into ffmpeg.wasm. A Python `subprocess` shim intercepts `Popen`/`run`/`check_output` for ffmpeg/ffprobe, stages input files from Pyodide's MEMFS to the services worker over a chunked SAB transfer, runs `ffmpeg.exec(argv)` in ffmpeg.wasm, stages outputs back, and returns a faithful fake process (returncode + stderr). An ffprobe-compat layer synthesizes `ffprobe -of json` output from `ffmpeg -i` stderr (the core ships no ffprobe).

**Architecture:** Builds on Phases 1–2. New opcodes (`FS_PUT`/`FS_GET`/`FS_STAT`/`FS_DELETE`/`FFMPEG_EXEC`) flow over the existing SAB bridge. The services worker gains a `FileStore` (staging) + a lazily-loaded ffmpeg.wasm (`@ffmpeg/core-mt` from CDN via `toBlobURL`); its `SabResponder` handler dispatches by opcode. Three Python modules (`fs.py`, `subprocess_shim.py`, `ffprobe_compat.py`) are installed at boot. A self-contained WAV→MP3 capstone proves the path with no network.

**Tech Stack:** `@ffmpeg/ffmpeg` + `@ffmpeg/util` (bundled), `@ffmpeg/core-mt` (CDN, external), Pyodide (Phase 2), Vitest (pure codec/FileStore units), Playwright MCP (capstone). Spec: `docs/superpowers/specs/2026-06-19-yt-dlp-wasm-design.md`. Prereq: Phases 1–2 usable.

**Scope:** Proves the subprocess-shim → ffmpeg.wasm mechanism for **file-based** ffmpeg invocations (merge/remux/extract-audio shape: inputs via `-i`, one positional output) + ffprobe synthesis. Does NOT yet run yt-dlp's full postprocessor on a real download (needs Phase 4 networking) and does NOT handle `pipe:`/stdin streaming ffmpeg calls (documented limitation). Chunked transfer is built but the capstone uses small files.

---

## Key risks (read first)

1. **ffmpeg.wasm worker loading under esbuild + COEP.** `@ffmpeg/ffmpeg`'s `FFmpeg` class spawns an internal "class worker". To avoid esbuild having to emit it (and to keep it same-origin under COEP), we pass **`classWorkerURL`** (a blob URL via `toBlobURL` from the CDN) to `ffmpeg.load()`, alongside the core's `coreURL`/`wasmURL`/`workerURL` blobs. If the pinned `@ffmpeg/ffmpeg` version doesn't accept `classWorkerURL`, the fallback is to leave `@ffmpeg/ffmpeg` bundled and let esbuild emit its worker (remove it from `external`). The Task-4 smoke is the gate.
2. **argv parsing in the shim is heuristic.** Inputs = arg after each `-i` (strip `file:` prefix); output = the last positional token. Covers yt-dlp's common ffmpeg commands; exotic multi-output/`-map`/`pipe:` calls are out of scope and will surface in the smoke/logs.
3. **ffprobe synthesis is best-effort.** Parsing `ffmpeg -i` stderr yields duration + per-stream codec/type/dimensions; fields yt-dlp can't get degrade gracefully (same as a partial real probe).
4. **Nested workers.** ffmpeg.wasm (in the services worker) spawns its own core worker → nested workers. Supported in modern Chromium/Firefox; Safari is the risk. The smoke runs in the dev browser.
5. **Memory.** Files round-trip fully through the SAB + both MEMFS. Large media is a Phase-4 concern; Phase 3 small files are fine.

---

## File Structure (Phase 3)

| File | Responsibility | New/Changed |
| --- | --- | --- |
| `src/client/protocol.ts` | Add `FS_PUT`/`FS_GET`/`FS_STAT`/`FS_DELETE`/`FFMPEG_EXEC` opcodes | changed |
| `src/bridge/frame.ts` (+test) | Length-prefixed `[metaLen][meta JSON][body]` frame codec | new |
| `src/services-worker/file-store.ts` (+test) | In-memory staging store (offset writes, ranged reads) | new |
| `src/services-worker/ffmpeg.ts` | Lazy ffmpeg.wasm load + `runFfmpeg(store, meta)` | new |
| `src/services-worker/worker.ts` | Opcode dispatch (ECHO + FS ops + FFMPEG_EXEC) | changed |
| `src/services-worker/config.ts` (+test) | `resolveFfmpegCoreURL` / class-worker URL | new |
| `src/pyodide-worker/py/fs.py` | Python chunked FS transfer + frame codec | new |
| `src/pyodide-worker/py/subprocess_shim.py` | Patch `subprocess` for ffmpeg/ffprobe | new |
| `src/pyodide-worker/py/ffprobe_compat.py` | Synthesize ffprobe JSON from ffmpeg stderr | new |
| `src/pyodide-worker/boot.ts` | Install the three shims after Pyodide loads; pass ffmpeg config | changed |
| `src/client/controller.ts` | `ffmpegSelfTest()` capstone method + ffmpeg config plumbing | changed |
| `src/app/yt-dlp-test/page.tsx` | "ffmpeg self-test" panel | changed |

---

## Task 1: Opcodes + frame codec + FileStore (TDD)

**Files:**
- Modify: `packages/yt-dlp-wasm/src/client/protocol.ts`
- Create: `packages/yt-dlp-wasm/src/bridge/frame.ts` + `frame.test.ts`
- Create: `packages/yt-dlp-wasm/src/services-worker/file-store.ts` + `file-store.test.ts`
- Create: `packages/yt-dlp-wasm/src/services-worker/config.ts` + `config.test.ts`

- [x] **Step 1: Extend `OP` in `protocol.ts`** (keep ECHO = 1):

```ts
export const OP = {
  ECHO: 1,
  FS_PUT: 2,
  FS_GET: 3,
  FS_STAT: 4,
  FS_DELETE: 5,
  FFMPEG_EXEC: 6,
} as const;
```

- [x] **Step 2: Write `frame.test.ts`** (failing):

```ts
import { describe, expect, it } from "vitest";
import { decodeFrame, encodeFrame } from "./frame";

describe("frame codec", () => {
  it("round-trips meta + body", () => {
    const body = new Uint8Array([1, 2, 3, 255]);
    const { meta, body: out } = decodeFrame(encodeFrame({ name: "a", offset: 5 }, body));
    expect(meta).toEqual({ name: "a", offset: 5 });
    expect([...out]).toEqual([1, 2, 3, 255]);
  });

  it("handles empty body", () => {
    const { meta, body } = decodeFrame(encodeFrame({ ok: true }));
    expect(meta).toEqual({ ok: true });
    expect(body.length).toBe(0);
  });

  it("handles unicode meta", () => {
    const { meta } = decodeFrame(encodeFrame({ name: "café/二.mp3" }));
    expect(meta).toEqual({ name: "café/二.mp3" });
  });
});
```

- [x] **Step 3: Write `frame.ts`:**

```ts
// Length-prefixed bridge frame: [uint32 LE metaLen][meta JSON utf8][raw body].
const enc = new TextEncoder();
const dec = new TextDecoder();

export function encodeFrame(
  meta: unknown,
  body: Uint8Array = new Uint8Array(0),
): Uint8Array {
  const metaBytes = enc.encode(JSON.stringify(meta));
  const out = new Uint8Array(4 + metaBytes.length + body.length);
  new DataView(out.buffer).setUint32(0, metaBytes.length, true);
  out.set(metaBytes, 4);
  out.set(body, 4 + metaBytes.length);
  return out;
}

export interface DecodedFrame<M = Record<string, unknown>> {
  meta: M;
  body: Uint8Array;
}

export function decodeFrame<M = Record<string, unknown>>(
  frame: Uint8Array,
): DecodedFrame<M> {
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  const metaLen = view.getUint32(0, true);
  const meta = JSON.parse(dec.decode(frame.subarray(4, 4 + metaLen))) as M;
  // Copy the body so it is detached from any SAB-backed source.
  return { meta, body: frame.slice(4 + metaLen) };
}
```

- [x] **Step 4: Write `file-store.test.ts`** (failing):

```ts
import { describe, expect, it } from "vitest";
import { FileStore } from "./file-store";

describe("FileStore", () => {
  it("puts at offsets and stats/gets", () => {
    const s = new FileStore();
    s.put("f", 0, new Uint8Array([1, 2, 3]));
    s.put("f", 3, new Uint8Array([4, 5]));
    expect(s.stat("f")).toBe(5);
    const { body, eof } = s.get("f", 0, 3);
    expect([...body]).toEqual([1, 2, 3]);
    expect(eof).toBe(false);
    const tail = s.get("f", 3, 100);
    expect([...tail.body]).toEqual([4, 5]);
    expect(tail.eof).toBe(true);
  });

  it("delete + has + set/raw", () => {
    const s = new FileStore();
    s.set("g", new Uint8Array([9]));
    expect(s.has("g")).toBe(true);
    expect([...(s.raw("g") ?? [])]).toEqual([9]);
    s.delete("g");
    expect(s.has("g")).toBe(false);
  });

  it("stat/get throw for missing files", () => {
    const s = new FileStore();
    expect(() => s.stat("nope")).toThrow(/no such file/);
  });
});
```

- [x] **Step 5: Write `file-store.ts`:**

```ts
/** In-memory staging store for files crossing the bridge (offset writes, ranged reads). */
export class FileStore {
  private readonly files = new Map<string, Uint8Array>();

  put(name: string, offset: number, body: Uint8Array): void {
    const existing = this.files.get(name);
    const end = offset + body.length;
    if (!existing || existing.length < end) {
      const grown = new Uint8Array(Math.max(end, existing?.length ?? 0));
      if (existing) grown.set(existing, 0);
      grown.set(body, offset);
      this.files.set(name, grown);
    } else {
      existing.set(body, offset);
    }
  }

  stat(name: string): number {
    const f = this.files.get(name);
    if (!f) throw new Error(`no such file: ${name}`);
    return f.length;
  }

  get(name: string, offset: number, len: number): { body: Uint8Array; eof: boolean } {
    const f = this.files.get(name);
    if (!f) throw new Error(`no such file: ${name}`);
    const end = Math.min(offset + len, f.length);
    return { body: f.slice(offset, end), eof: end >= f.length };
  }

  delete(name: string): void {
    this.files.delete(name);
  }
  has(name: string): boolean {
    return this.files.has(name);
  }
  set(name: string, data: Uint8Array): void {
    this.files.set(name, data);
  }
  raw(name: string): Uint8Array | undefined {
    return this.files.get(name);
  }
}
```

- [x] **Step 6: Write `config.test.ts` + `config.ts`** (services-worker config; pure):

`config.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { FFMPEG_CORE_VERSION, resolveFfmpegCore } from "./config";

describe("resolveFfmpegCore", () => {
  it("defaults to the jsDelivr core-mt esm dir for the pinned version", () => {
    const r = resolveFfmpegCore();
    expect(r.coreURL).toBe(
      `https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/esm/ffmpeg-core.js`,
    );
    expect(r.wasmURL).toMatch(/ffmpeg-core\.wasm$/);
    expect(r.workerURL).toMatch(/ffmpeg-core\.worker\.js$/);
  });

  it("honors a base override", () => {
    const r = resolveFfmpegCore({ ffmpegCoreBaseURL: "https://x/core" });
    expect(r.coreURL).toBe("https://x/core/ffmpeg-core.js");
  });
});
```

`config.ts`:
```ts
/** Pinned @ffmpeg/core-mt version (CDN assets). Keep in sync with the @ffmpeg/* devDeps. */
export const FFMPEG_CORE_VERSION = "0.12.10";
/** Pinned @ffmpeg/ffmpeg version (for the class-worker blob). Set to the installed devDep. */
export const FFMPEG_PKG_VERSION = "0.12.15";

export interface FfmpegConfig {
  /** Override the core-mt asset base dir (no trailing slash). Default: jsDelivr esm. */
  ffmpegCoreBaseURL?: string;
  /** Override the @ffmpeg/ffmpeg class-worker URL. Default: jsDelivr esm worker.js. */
  ffmpegClassWorkerURL?: string;
}

export interface FfmpegCoreUrls {
  coreURL: string;
  wasmURL: string;
  workerURL: string;
  classWorkerURL: string;
}

export function resolveFfmpegCore(config: FfmpegConfig = {}): FfmpegCoreUrls {
  const base =
    config.ffmpegCoreBaseURL ??
    `https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@${FFMPEG_CORE_VERSION}/dist/esm`;
  const classWorkerURL =
    config.ffmpegClassWorkerURL ??
    `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_PKG_VERSION}/dist/esm/worker.js`;
  return {
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    workerURL: `${base}/ffmpeg-core.worker.js`,
    classWorkerURL,
  };
}
```

- [x] **Step 7: Run tests / typecheck / lint** — `pnpm -F @local/yt-dlp-wasm test` (Phase-1/2 + new pass), `typecheck` clean, `lint` clean.

- [x] **Step 8: Commit**

```bash
git add packages/yt-dlp-wasm/src/client/protocol.ts packages/yt-dlp-wasm/src/bridge/frame.ts packages/yt-dlp-wasm/src/bridge/frame.test.ts packages/yt-dlp-wasm/src/services-worker/file-store.ts packages/yt-dlp-wasm/src/services-worker/file-store.test.ts packages/yt-dlp-wasm/src/services-worker/config.ts packages/yt-dlp-wasm/src/services-worker/config.test.ts
git commit -m "feat(yt-dlp-wasm): frame codec, file store, ffmpeg config + opcodes"
```

---

## Task 2: ffmpeg.wasm in the services worker

No unit test (needs ffmpeg.wasm); verified by the Task-4 smoke.

**Files:**
- Modify: `packages/yt-dlp-wasm/package.json` (add `@ffmpeg/ffmpeg`, `@ffmpeg/util`)
- Modify: `packages/yt-dlp-wasm/build.mjs` (un-external `@ffmpeg/ffmpeg`+`@ffmpeg/util`)
- Create: `packages/yt-dlp-wasm/src/services-worker/ffmpeg.ts`
- Modify: `packages/yt-dlp-wasm/src/services-worker/worker.ts`

- [x] **Step 1: Add deps** — `pnpm -F @local/yt-dlp-wasm add @ffmpeg/ffmpeg @ffmpeg/util`. Then set `FFMPEG_PKG_VERSION` in `config.ts` to the installed `@ffmpeg/ffmpeg` version (read it: `node -e "console.log(require('./packages/yt-dlp-wasm/node_modules/@ffmpeg/ffmpeg/package.json').version)"`), and confirm `@ffmpeg/core-mt`'s matching version (the FFmpeg pkg's peer/expected core) — set `FFMPEG_CORE_VERSION` to a core-mt version published on jsDelivr (verify `https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@<v>/dist/esm/ffmpeg-core.js` is reachable).

- [x] **Step 2: `build.mjs`** — change `external` to only `["pyodide", "@ffmpeg/core-mt", "libcurl.js"]` (drop `@ffmpeg/ffmpeg` and `@ffmpeg/util` so they bundle; core-mt stays external as it's only ever loaded via `toBlobURL`).

- [x] **Step 3: `src/services-worker/ffmpeg.ts`:**

```ts
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import type { DecodedFrame } from "../bridge/frame";
import { encodeFrame } from "../bridge/frame";
import { type FfmpegConfig, resolveFfmpegCore } from "./config";
import type { FileStore } from "./file-store";

let instance: FFmpeg | undefined;

async function ensureFfmpeg(config: FfmpegConfig): Promise<FFmpeg> {
  if (instance) return instance;
  const { coreURL, wasmURL, workerURL, classWorkerURL } = resolveFfmpegCore(config);
  const ff = new FFmpeg();
  await ff.load({
    coreURL: await toBlobURL(coreURL, "text/javascript"),
    wasmURL: await toBlobURL(wasmURL, "application/wasm"),
    workerURL: await toBlobURL(workerURL, "text/javascript"),
    classWorkerURL: await toBlobURL(classWorkerURL, "text/javascript"),
  });
  instance = ff;
  return ff;
}

export interface FfmpegExecMeta {
  argv: string[];
  inputs: string[];
  outputs: string[];
}

/** Run ffmpeg.wasm on staged files; returns an encoded frame {code, stderr}. */
export async function runFfmpeg(
  store: FileStore,
  frame: DecodedFrame<FfmpegExecMeta>,
  config: FfmpegConfig,
): Promise<Uint8Array> {
  const { argv, inputs, outputs } = frame.meta;
  const ff = await ensureFfmpeg(config);

  for (const name of inputs) {
    const data = store.raw(name);
    if (data) await ff.writeFile(name, data);
  }

  let stderr = "";
  const onLog = ({ message }: { message: string }) => {
    stderr += `${message}\n`;
  };
  ff.on("log", onLog);
  let code: number;
  try {
    code = await ff.exec(argv);
  } finally {
    ff.off("log", onLog);
  }

  for (const name of outputs) {
    try {
      const data = (await ff.readFile(name)) as Uint8Array;
      store.set(name, data);
    } catch {
      // output not produced (e.g. ffmpeg failed) — leave absent
    }
  }
  for (const name of [...inputs, ...outputs]) {
    try {
      await ff.deleteFile(name);
    } catch {
      // ignore
    }
  }
  return encodeFrame({ code, stderr });
}
```

- [x] **Step 4: Rewrite `src/services-worker/worker.ts`** to dispatch by opcode:

```ts
/// <reference lib="webworker" />
import { decodeFrame, encodeFrame } from "../bridge/frame";
import { OP } from "../client/protocol";
import { SabResponder } from "../bridge/sab";
import type { FfmpegConfig } from "./config";
import { FileStore } from "./file-store";
import { type FfmpegExecMeta, runFfmpeg } from "./ffmpeg";

declare const self: DedicatedWorkerGlobalScope;

const store = new FileStore();
let ffmpegConfig: FfmpegConfig = {};

async function handle(op: number, payload: Uint8Array): Promise<Uint8Array> {
  switch (op) {
    case OP.ECHO:
      return Uint8Array.from(payload, (b) => (b >= 97 && b <= 122 ? b - 32 : b));
    case OP.FS_PUT: {
      const { meta, body } = decodeFrame<{ name: string; offset: number }>(payload);
      store.put(meta.name, meta.offset, body);
      return encodeFrame({ ok: true });
    }
    case OP.FS_STAT: {
      const { meta } = decodeFrame<{ name: string }>(payload);
      return encodeFrame({ size: store.stat(meta.name) });
    }
    case OP.FS_GET: {
      const { meta } = decodeFrame<{ name: string; offset: number; len: number }>(payload);
      const { body, eof } = store.get(meta.name, meta.offset, meta.len);
      return encodeFrame({ eof }, body);
    }
    case OP.FS_DELETE: {
      const { meta } = decodeFrame<{ name: string }>(payload);
      store.delete(meta.name);
      return encodeFrame({ ok: true });
    }
    case OP.FFMPEG_EXEC:
      return runFfmpeg(store, decodeFrame<FfmpegExecMeta>(payload), ffmpegConfig);
    default:
      throw new Error(`unknown op ${op}`);
  }
}

let responder: SabResponder | undefined;

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg?.type === "init") {
    const wakePort: MessagePort = msg.wakePort;
    ffmpegConfig = (msg.ffmpegConfig ?? {}) as FfmpegConfig;
    responder = new SabResponder(msg.sab as SharedArrayBuffer, handle);
    wakePort.onmessage = () => {
      void responder?.handle();
    };
  }
};
```

- [x] **Step 5: Build + typecheck + lint** — `pnpm -F @local/yt-dlp-wasm build` completes; `typecheck`/`lint` clean; `test` still green. (Confirm `@ffmpeg/ffmpeg` bundled into `dist/services-worker/worker.js`: `grep -c "FFmpeg" packages/yt-dlp-wasm/dist/services-worker/worker.js` ≥ 1.)

- [x] **Step 6: Commit**

```bash
git add packages/yt-dlp-wasm/package.json pnpm-lock.yaml packages/yt-dlp-wasm/build.mjs packages/yt-dlp-wasm/src/services-worker/ffmpeg.ts packages/yt-dlp-wasm/src/services-worker/worker.ts packages/yt-dlp-wasm/src/services-worker/config.ts
git commit -m "feat(yt-dlp-wasm): ffmpeg.wasm exec + FS staging in the services worker"
```

---

## Task 3: Python subprocess shim + ffprobe compat

No unit test (needs Pyodide + ffmpeg); verified by the Task-4 smoke. This is the highest-risk task — expect smoke-driven iteration.

**Files:**
- Create: `packages/yt-dlp-wasm/src/pyodide-worker/py/fs.py`
- Create: `packages/yt-dlp-wasm/src/pyodide-worker/py/subprocess_shim.py`
- Create: `packages/yt-dlp-wasm/src/pyodide-worker/py/ffprobe_compat.py`
- Modify: `packages/yt-dlp-wasm/src/pyodide-worker/boot.ts` (install the shims; pass ffmpegConfig is in Task 2's worker, not here)

- [x] **Step 1: `py/fs.py`** — chunked transfer + shared helpers:

```python
"""Chunked file transfer over the JS sync bridge (ytdlp_bridge_js.call)."""

import json
import struct

import ytdlp_bridge_js
from pyodide.ffi import to_js

OP_FS_PUT = 2
OP_FS_GET = 3
OP_FS_STAT = 4
OP_FS_DELETE = 5
OP_FFMPEG_EXEC = 6

CHUNK = 8 * 1024 * 1024  # 8 MiB; fits inside the default 16 MiB SAB region


def strip_file_prefix(p: str) -> str:
    return p[5:] if p.startswith("file:") else p


def call(op: int, meta: dict, body: bytes = b"") -> tuple[dict, bytes]:
    meta_bytes = json.dumps(meta).encode()
    frame = struct.pack("<I", len(meta_bytes)) + meta_bytes + body
    result = ytdlp_bridge_js.call(op, to_js(frame))
    raw = bytes(result.to_py()) if hasattr(result, "to_py") else bytes(result)
    mlen = struct.unpack("<I", raw[:4])[0]
    rmeta = json.loads(raw[4 : 4 + mlen].decode())
    return rmeta, raw[4 + mlen :]


def put_file(name: str, data: bytes) -> None:
    if not data:
        call(OP_FS_PUT, {"name": name, "offset": 0})
        return
    offset = 0
    while offset < len(data):
        chunk = data[offset : offset + CHUNK]
        call(OP_FS_PUT, {"name": name, "offset": offset}, chunk)
        offset += len(chunk)


def get_file(name: str) -> bytes:
    rmeta, _ = call(OP_FS_STAT, {"name": name})
    size = rmeta["size"]
    out = bytearray()
    while len(out) < size:
        rmeta, rbody = call(OP_FS_GET, {"name": name, "offset": len(out), "len": CHUNK})
        out += rbody
        if rmeta.get("eof"):
            break
    return bytes(out)


def delete_file(name: str) -> None:
    call(OP_FS_DELETE, {"name": name})
```

- [x] **Step 2: `py/ffprobe_compat.py`** — synthesize ffprobe JSON:

```python
"""Emulate `ffprobe -of json` by parsing `ffmpeg -i <file>` stderr."""

import json
import os
import re

import fs

_DURATION = re.compile(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)")
_STREAM = re.compile(r"Stream #\d+:\d+.*?: (\w+): (\w+)")
_VIDEO_DIMS = re.compile(r"(\d{2,5})x(\d{2,5})")


def _parse(stderr: str) -> dict:
    fmt: dict = {}
    streams: list[dict] = []
    m = _DURATION.search(stderr)
    if m:
        h, mm, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        fmt["duration"] = f"{h * 3600 + mm * 60 + s:.6f}"
    for line in stderr.splitlines():
        sm = _STREAM.search(line)
        if not sm:
            continue
        kind, codec = sm.group(1).lower(), sm.group(2)
        st = {"codec_type": kind, "codec_name": codec}
        if kind == "video":
            dm = _VIDEO_DIMS.search(line)
            if dm:
                st["width"], st["height"] = int(dm.group(1)), int(dm.group(2))
        streams.append(st)
    return {"streams": streams, "format": fmt}


def run(args: list[str]) -> tuple[int, bytes, bytes]:
    rest = args[1:]
    if "-version" in rest:
        return 0, b"ffprobe version wasm-yt-dlp\n", b""
    infile = None
    for tok in reversed(rest):
        cand = fs.strip_file_prefix(tok)
        if os.path.exists(cand):
            infile = cand
            break
    if not infile:
        return 1, b"", b"ffprobe: no input file found\n"
    base = os.path.basename(infile)
    with open(infile, "rb") as f:
        fs.put_file(base, f.read())
    rmeta, _ = fs.call(fs.OP_FFMPEG_EXEC, {"argv": ["-i", base], "inputs": [base], "outputs": []})
    fs.delete_file(base)
    info = _parse(rmeta.get("stderr", ""))
    return 0, json.dumps(info).encode(), b""
```

- [x] **Step 3: `py/subprocess_shim.py`** — patch subprocess:

```python
"""Route subprocess ffmpeg/ffprobe calls into ffmpeg.wasm via the bridge."""

import os
import subprocess

import ffprobe_compat
import fs

_FFMPEG = ("ffmpeg", "avconv")
_FFPROBE = ("ffprobe", "avprobe")


def _kind(args) -> str | None:
    if not args:
        return None
    prog = os.path.basename(str(args[0])).lower()
    if any(prog == n or prog.startswith(n) for n in _FFPROBE):
        return "ffprobe"
    if any(prog == n or prog.startswith(n) for n in _FFMPEG):
        return "ffmpeg"
    return None


def _run_ffmpeg(args) -> tuple[int, bytes, bytes]:
    rest = [str(a) for a in args[1:]]
    if "-version" in rest:
        return 0, b"", b"ffmpeg version wasm-yt-dlp\nbuilt with ffmpeg.wasm\n"

    inputs: list[tuple[str, str]] = []
    out_argv: list[str] = []
    i = 0
    while i < len(rest):
        a = rest[i]
        if a == "-i" and i + 1 < len(rest):
            src = fs.strip_file_prefix(rest[i + 1])
            base = os.path.basename(src)
            inputs.append((src, base))
            out_argv.extend(["-i", base])
            i += 2
            continue
        out_argv.append(a)
        i += 1

    out_src = fs.strip_file_prefix(rest[-1]) if rest else ""
    out_base = os.path.basename(out_src)
    if out_argv:
        out_argv[-1] = out_base

    in_bases: list[str] = []
    for src, base in inputs:
        with open(src, "rb") as f:
            fs.put_file(base, f.read())
        in_bases.append(base)

    rmeta, _ = fs.call(
        fs.OP_FFMPEG_EXEC,
        {"argv": out_argv, "inputs": in_bases, "outputs": [out_base] if out_base else []},
    )
    code = int(rmeta.get("code", 1))
    stderr = rmeta.get("stderr", "").encode()

    if out_base:
        try:
            data = fs.get_file(out_base)
            with open(out_src, "wb") as f:
                f.write(data)
            fs.delete_file(out_base)
        except Exception:
            pass
    for base in in_bases:
        try:
            fs.delete_file(base)
        except Exception:
            pass
    return code, b"", stderr


class _FakePopen:
    def __init__(self, args, **kwargs):
        self.args = args
        kind = _kind(args)
        if kind == "ffmpeg":
            self.returncode, self._out, self._err = _run_ffmpeg(args)
        elif kind == "ffprobe":
            self.returncode, self._out, self._err = ffprobe_compat.run([str(a) for a in args])
        else:
            raise OSError(f"subprocess not supported in pyodide: {args}")
        self.stdin = None
        self.stdout = None
        self.stderr = None
        self.pid = -1

    def communicate(self, input=None, timeout=None):
        return self._out, self._err

    def wait(self, timeout=None):
        return self.returncode

    def poll(self):
        return self.returncode

    def kill(self):
        pass

    def terminate(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def _run(args, **kwargs):
    p = _FakePopen(args, **kwargs)
    out, err = p.communicate(kwargs.get("input"))
    if kwargs.get("check") and p.returncode != 0:
        raise subprocess.CalledProcessError(p.returncode, args, out, err)
    return subprocess.CompletedProcess(args, p.returncode, out, err)


def _check_output(args, **kwargs):
    p = _FakePopen(args, **kwargs)
    out, err = p.communicate(kwargs.get("input"))
    if p.returncode != 0:
        raise subprocess.CalledProcessError(p.returncode, args, out, err)
    return out


def install() -> None:
    subprocess.Popen = _FakePopen
    subprocess.run = _run
    subprocess.check_output = _check_output
```

- [x] **Step 4: Install the shims in `boot.ts`** — after `pyodide.runPython(bridgePy)` and BEFORE the yt-dlp install (so subprocess is patched before yt-dlp could use it). Add imports of the new `.py` files and run them. Insert:

```ts
// (top of file, with the other .py imports)
import fsPy from "./py/fs.py";
import ffprobePy from "./py/ffprobe_compat.py";
import subprocessPy from "./py/subprocess_shim.py";
```

and, right after `pyodide.runPython(bridgePy);`:

```ts
  // Install the Python modules into the in-memory FS so they import each other
  // by name, then patch subprocess.
  pyodide.FS.writeFile("/lib/python3.14/site-packages/fs.py", fsPy);
  pyodide.FS.writeFile("/lib/python3.14/site-packages/ffprobe_compat.py", ffprobePy);
  pyodide.FS.writeFile("/lib/python3.14/site-packages/subprocess_shim.py", subprocessPy);
  pyodide.runPython("import subprocess_shim; subprocess_shim.install()");
```

NOTE: the `site-packages` path is Python-version specific. Determine the real path at runtime instead of hardcoding — replace the three `writeFile` lines + the import with:

```ts
  pyodide.runPython(`
import sys, importlib
_mods = {"fs": ${JSON.stringify(fsPy)}, "ffprobe_compat": ${JSON.stringify(ffprobePy)}, "subprocess_shim": ${JSON.stringify(subprocessPy)}}
import os
_dir = "/tmp/ytdlp_py"
os.makedirs(_dir, exist_ok=True)
if _dir not in sys.path:
    sys.path.insert(0, _dir)
for _name, _src in _mods.items():
    with open(os.path.join(_dir, _name + ".py"), "w") as _f:
        _f.write(_src)
import subprocess_shim
subprocess_shim.install()
`);
```

This writes the modules to `/tmp/ytdlp_py`, adds it to `sys.path`, and installs the shim — version-independent.

- [x] **Step 5: Build + typecheck + lint** — all green. Confirm the shim text is inlined: `grep -c "subprocess.Popen" packages/yt-dlp-wasm/dist/pyodide-worker/worker.js` ≥ 1.

- [x] **Step 6: Commit**

```bash
git add packages/yt-dlp-wasm/src/pyodide-worker/py/fs.py packages/yt-dlp-wasm/src/pyodide-worker/py/ffprobe_compat.py packages/yt-dlp-wasm/src/pyodide-worker/py/subprocess_shim.py packages/yt-dlp-wasm/src/pyodide-worker/boot.ts
git commit -m "feat(yt-dlp-wasm): python subprocess shim + ffprobe compat"
```

---

## Task 4: Capstone smoke — WAV → MP3 through the shim

Self-contained (no network): synth a tiny WAV in the browser, stage it into Pyodide's MEMFS, run `subprocess.run(["ffmpeg","-i","in.wav","out.mp3"])` (through the shim → ffmpeg.wasm), read `out.mp3` back, and run the ffprobe-compat on it.

**Files:**
- Modify: `packages/yt-dlp-wasm/src/client/controller.ts` (add `ffmpegSelfTest`)
- Modify: `packages/yt-dlp-wasm/src/pyodide-worker/worker.ts` (handle `ffmpeg-self-test`)
- Modify: `src/app/yt-dlp-test/page.tsx` (panel)

- [x] **Step 1: Add a worker handler** in `pyodide-worker/worker.ts` for `ffmpeg-self-test` (sibling to `py-echo`). It receives a base64 WAV, writes it to MEMFS, runs the shimmed ffmpeg + ffprobe in Python, returns `{ outSize, probe }`:

```ts
  } else if (msg?.type === "ffmpeg-self-test") {
    void handleFfmpegSelfTest(msg.wavBase64 as string);
  }
```
```ts
async function handleFfmpegSelfTest(wavBase64: string): Promise<void> {
  try {
    const { pyodide } = await runtime!;
    pyodide.globals.set("_wav_b64", wavBase64);
    const result = pyodide.runPython(`
import base64, json, subprocess, os
with open("/tmp/in.wav", "wb") as f:
    f.write(base64.b64decode(_wav_b64))
cp = subprocess.run(["ffmpeg", "-y", "-i", "/tmp/in.wav", "/tmp/out.mp3"])
out_size = os.path.getsize("/tmp/out.mp3") if os.path.exists("/tmp/out.mp3") else 0
import ffprobe_compat
code, probe_json, _ = ffprobe_compat.run(["ffprobe", "/tmp/out.mp3"])
json.dumps({"code": cp.returncode, "outSize": out_size, "probe": probe_json.decode()})
`) as string;
    self.postMessage({ type: "ffmpeg-self-test-result", text: result });
  } catch (err) {
    self.postMessage({ type: "ffmpeg-self-test-result", error: messageOf(err) });
  }
}
```
(Use the same `runtime` guard pattern as `handlePyEcho`: `if (!runtime) throw new Error("ffmpeg-self-test before init")`.)

- [x] **Step 2: Controller `ffmpegSelfTest`** in `controller.ts` — add to the `YtDlp` interface and the returned object, using the existing `once` helper:

```ts
  ffmpegSelfTest(wavBase64: string): Promise<{ code: number; outSize: number; probe: string }>;
```
```ts
    ffmpegSelfTest: (wavBase64) =>
      once(
        "ffmpeg-self-test-result",
        () => pyodideWorker.postMessage({ type: "ffmpeg-self-test", wavBase64 }),
        (d) => JSON.parse(d.text as string),
      ),
```
Also plumb ffmpeg config: in `createYtDlp`, pass `ffmpegConfig` to the SERVICES worker init (`servicesWorker.postMessage({ type: "init", sab, wakePort: channel.port2, ffmpegConfig: bootConfig })`) — the services worker reads `msg.ffmpegConfig`. (`bootConfig` already excludes `dataCapacity`; `FfmpegConfig` fields like `ffmpegCoreBaseURL` live alongside the pyodide ones in `YtDlpConfig` — extend `YtDlpConfig` to also `extends FfmpegConfig`.)

- [x] **Step 3: Route panel** in `page.tsx` — add an "ffmpeg self-test" section. Synthesize a 0.2 s silent 8 kHz mono 16-bit WAV in the browser, base64-encode it, and call `ffmpegSelfTest`:

```tsx
function makeSilentWavBase64(): string {
  const sampleRate = 8000, seconds = 0.2;
  const n = Math.floor(sampleRate * seconds);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const wr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); wr(8, "WAVE"); wr(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); wr(36, "data"); v.setUint32(40, n * 2, true);
  let s = ""; const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
```

State + handler analogous to `bootAndTest` (reuse `createYtDlp`, `await load()`, then `await ytdlp.ffmpegSelfTest(makeSilentWavBase64())`), rendering: `✓ ffmpeg out.mp3 <outSize> bytes · probe <…>` on success.

Update the `YtDlpHandle` cast type in `loadYtDlp` to include `ffmpegSelfTest`.

- [x] **Step 4: Publish + verify** — `pnpm yt-dlp-wasm:public`; `pnpm exec biome check` (clean) + `pnpm exec tsc --noEmit` (exit 0); `pnpm -F @local/yt-dlp-wasm test` (Task-1 units pass).

- [x] **Step 5: Browser smoke (the gate)** — `pnpm dev`, open `/yt-dlp-test`, click "Run ffmpeg self-test", confirm `✓ ffmpeg out.mp3 <N> bytes` with `N > 0` and a probe JSON containing an `mp3`/`audio` stream. (Controller drives this; ~30–60s on first run incl. the ffmpeg core download. Expect smoke-driven fixes in the shim/argv parsing — that is the point of this gate.)

- [x] **Step 6: Commit**

```bash
git add packages/yt-dlp-wasm/src/client/controller.ts packages/yt-dlp-wasm/src/pyodide-worker/worker.ts src/app/yt-dlp-test/page.tsx
git commit -m "feat(yt-dlp-wasm): ffmpeg self-test (WAV->MP3) on the /yt-dlp-test route"
```

---

## Self-Review (against the spec)

- **ffmpeg/ffprobe subprocess calls bridged into ffmpeg.wasm** (spec "ffmpeg bridge"): `subprocess_shim.py` patches `Popen`/`run`/`check_output`; `_run_ffmpeg` stages + execs; `FFMPEG_EXEC` runs `ff.exec` capturing real stderr via `on('log')`. ✅
- **Cross-FS staging** (spec): `FileStore` + chunked `FS_PUT`/`FS_GET` move bytes between Pyodide MEMFS and ffmpeg.wasm FS. ✅
- **ffprobe compat** (spec "the compat layer earns its keep on ffprobe"): `ffprobe_compat.py` synthesizes JSON from `ffmpeg -i` stderr; `-version` special-cased on both. ✅
- **Real ffmpeg stderr surfaces to yt-dlp** (spec): captured via `on('log')`, returned in the fake process's stderr. ✅
- **Chunked/streaming SAB** (deferred from Phase 1): the frame codec + `FS_PUT(offset)`/`FS_GET(offset,len,eof)` implement it; Phase 3 uses it for small files. ✅
- **Out of scope (correct):** `pipe:`/stdin ffmpeg calls, yt-dlp's full postprocessor on a real download (Phase 4), large-media memory tuning.
- **Placeholder scan:** no TBD/TODO; version pins (`FFMPEG_*_VERSION`) carry explicit "set from install" instructions.
- **Type/name consistency:** `OP.*`, `encodeFrame`/`decodeFrame`, `FileStore`, `FfmpegExecMeta`, `runFfmpeg`, worker opcodes, and the Python `OP_*`/`fs.call` framing all agree across protocol.ts/frame.ts/file-store.ts/ffmpeg.ts/worker.ts and the `.py` modules.

## Notes for Phase 4+

- The opcode table is now duplicated in JS (`protocol.ts`) and Python (`fs.py` `OP_*`); Phase 4 should generate one from the other (flagged in Phase 2 too).
- Chunked `FS_GET` is the same shape Phase 4's streaming network reads need — reuse it.
- `pipe:`/stdin ffmpeg and the full FFmpegPostProcessor path get exercised once Phase 4 provides real downloads; revisit argv parsing (multi-output, `-map`) then.
- ffmpeg instance is a singleton in the services worker — fine for serial use; revisit if concurrent execs are ever needed.
