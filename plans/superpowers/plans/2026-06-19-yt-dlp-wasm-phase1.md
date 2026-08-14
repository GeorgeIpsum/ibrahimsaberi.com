# yt-dlp-wasm — Phase 1 Implementation Plan (Foundation + Sync Bridge)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Stand up the `@local/yt-dlp-wasm` package with its esbuild build and a working `SharedArrayBuffer` + `Atomics` synchronous bridge, proven end-to-end by a real cross-thread ECHO round-trip between two Web Workers under cross-origin isolation.

**Architecture:** Three contexts (main thread / Pyodide worker / services worker) communicate over one shared `SharedArrayBuffer`. The requester (eventually Pyodide) writes a request frame, nudges the responder via a `MessageChannel` so the responder's event loop stays free for async work, then parks on `Atomics.wait`. The responder runs the (possibly async) handler and signals completion via `Atomics.notify`. Phase 1 builds this skeleton with a trivial ECHO op; later phases swap in Pyodide/yt-dlp, ffmpeg.wasm, and libcurl.js.

**Tech Stack:** TypeScript, esbuild (bundle + worker entries), `tsc --emitDeclarationOnly` (types), Vitest (unit), Biome (lint), Playwright MCP (cross-thread smoke). Spec: `plans/superpowers/specs/2026-06-19-yt-dlp-wasm-design.md`.

**Scope note:** This is Phase 1 of a phased build. Phases 2–6 (Pyodide+yt-dlp, ffmpeg bridge, networking, public API, integration) are mapped in the Roadmap section and will each get their own detailed plan. Phase 1 produces working, independently-testable software: a package whose sync bridge is unit-tested and whose cross-thread mechanism is smoke-proven.

---

## File Structure (Phase 1)

All paths relative to repo root.

| File | Responsibility |
| --- | --- |
| `packages/yt-dlp-wasm/package.json` | Package manifest, `@local/yt-dlp-wasm`, scripts, dev deps |
| `packages/yt-dlp-wasm/tsconfig.json` | TS config: declaration-only emit to `dist/` |
| `packages/yt-dlp-wasm/biome.jsonc` | Extends root Biome config; disables lint on `dist/` |
| `packages/yt-dlp-wasm/vitest.config.ts` | Node-env unit tests under `src/**` |
| `packages/yt-dlp-wasm/build.mjs` | esbuild bundle (index + 2 worker entries) |
| `packages/yt-dlp-wasm/src/client/protocol.ts` | SAB control-region layout + opcodes (shared by all 3 contexts) |
| `packages/yt-dlp-wasm/src/bridge/sab.ts` | Frame read/write helpers + `SabRequester`/`SabResponder` |
| `packages/yt-dlp-wasm/src/bridge/sab.test.ts` | Unit tests for the bridge |
| `packages/yt-dlp-wasm/src/pyodide-worker/worker.ts` | Phase 1 stub: requester (issues ECHO `call`, blocks) |
| `packages/yt-dlp-wasm/src/services-worker/worker.ts` | Phase 1 stub: responder (ECHO = uppercase bytes) |
| `packages/yt-dlp-wasm/src/client/controller.ts` | `createYtDlp()`: allocate SAB, spawn workers, wire wake channel, expose `ping()` |
| `packages/yt-dlp-wasm/src/index.ts` | Public exports |
| `packages/yt-dlp-wasm/test-harness/index.html` | Page that calls `createYtDlp().ping()` |
| `packages/yt-dlp-wasm/test-harness/serve.mjs` | Static server sending COOP/COEP headers |

---

## Task 1: Scaffold the package

**Files:**
- Create: `packages/yt-dlp-wasm/package.json`
- Create: `packages/yt-dlp-wasm/tsconfig.json`
- Create: `packages/yt-dlp-wasm/biome.jsonc`
- Create: `packages/yt-dlp-wasm/vitest.config.ts`

- [x] **Step 1: Write `package.json`**

```json
{
  "name": "@local/yt-dlp-wasm",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Run yt-dlp in the browser via Pyodide + ffmpeg.wasm.",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "dev": "node build.mjs --watch",
    "build": "node build.mjs && tsc --emitDeclarationOnly",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome check"
  },
  "devDependencies": {
    "@types/node": "22.13.4",
    "esbuild": "^0.25.0",
    "typescript": "6.0.3",
    "vitest": "^4.1.7"
  }
}
```

- [x] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable", "WebWorker"],
    "rootDir": "src",
    "outDir": "dist",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "dist", "test-harness"]
}
```

Note: `DOM` and `WebWorker` libs both declare `self`; `skipLibCheck` keeps this from erroring. Worker files below pin the precise `self` type locally.

- [x] **Step 3: Write `biome.jsonc`** (mirrors `packages/rehype-callouts/biome.jsonc`)

```jsonc
{
  "extends": "//",
  "overrides": [
    {
      "includes": ["dist/**/*.js"],
      "assist": { "enabled": false },
      "formatter": { "enabled": false },
      "linter": { "enabled": false }
    }
  ]
}
```

- [x] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
```

- [x] **Step 5: Install + verify the workspace sees the package**

Run: `pnpm install`
Then run: `pnpm -F @local/yt-dlp-wasm exec true`
Expected: install completes; the filtered command resolves the package without "No projects matched the filters".

- [x] **Step 6: Commit**

```bash
git add packages/yt-dlp-wasm/package.json packages/yt-dlp-wasm/tsconfig.json packages/yt-dlp-wasm/biome.jsonc packages/yt-dlp-wasm/vitest.config.ts pnpm-lock.yaml
git commit -m "feat(yt-dlp-wasm): scaffold package"
```

---

## Task 2: Protocol constants (`protocol.ts`)

**Files:**
- Create: `packages/yt-dlp-wasm/src/client/protocol.ts`

- [x] **Step 1: Write `protocol.ts`**

```ts
// SAB control-region layout (Int32 slots) and opcodes, shared by all three contexts.

/** Number of Int32 slots in the control region. */
export const CTRL_SLOTS = 4;
/** Control-region size in bytes (Int32Array prefix of the SharedArrayBuffer). */
export const CTRL_BYTES = CTRL_SLOTS * 4; // 16

/** Indices into the control-region Int32Array view. */
export const SLOT = {
  STATE: 0,
  OP: 1,
  LEN: 2,
  REQ_ID: 3,
} as const;

/** Channel states stored in `SLOT.STATE`. */
export const STATE = {
  IDLE: 0,
  REQUEST: 1,
  RESPONSE: 2,
  ERROR: 3,
} as const;

/** Bridge opcodes. Phase 1 needs only ECHO; later phases add NET_SEND, FFMPEG_EXEC, FS_READ. */
export const OP = {
  ECHO: 1,
} as const;

export type Op = (typeof OP)[keyof typeof OP];
```

- [x] **Step 2: Commit**

```bash
git add packages/yt-dlp-wasm/src/client/protocol.ts
git commit -m "feat(yt-dlp-wasm): define SAB protocol layout"
```

---

## Task 3: Frame helpers (`sab.ts`) — TDD

**Files:**
- Create: `packages/yt-dlp-wasm/src/bridge/sab.ts`
- Test: `packages/yt-dlp-wasm/src/bridge/sab.test.ts`

- [x] **Step 1: Write the failing test for frame round-trip**

```ts
import { describe, expect, it } from "vitest";
import { OP, SLOT, STATE } from "../client/protocol";
import {
  createSab,
  readRequest,
  readResponse,
  writeRequest,
  writeResponse,
} from "./sab";

const enc = (s: string) => new TextEncoder().encode(s);
const dec = (b: Uint8Array) => new TextDecoder().decode(b);
const stateOf = (sab: SharedArrayBuffer) =>
  Atomics.load(new Int32Array(sab, 0, 4), SLOT.STATE);

describe("sab frames", () => {
  it("writes then reads a request frame", () => {
    const sab = createSab(1024);
    writeRequest(sab, OP.ECHO, enc("hello"));
    const req = readRequest(sab);
    expect(req.op).toBe(OP.ECHO);
    expect(dec(req.payload)).toBe("hello");
    expect(stateOf(sab)).toBe(STATE.REQUEST);
  });

  it("round-trips a response and returns to IDLE", () => {
    const sab = createSab(1024);
    writeRequest(sab, OP.ECHO, new Uint8Array([1, 2, 3]));
    readRequest(sab);
    writeResponse(sab, enc("HELLO"), false);
    expect(dec(readResponse(sab))).toBe("HELLO");
    expect(stateOf(sab)).toBe(STATE.IDLE);
  });

  it("surfaces an error frame as a throw", () => {
    const sab = createSab(1024);
    writeRequest(sab, OP.ECHO, new Uint8Array());
    readRequest(sab);
    writeResponse(sab, enc("boom"), true);
    expect(() => readResponse(sab)).toThrow("boom");
  });

  it("rejects a payload larger than capacity", () => {
    const sab = createSab(4);
    expect(() => writeRequest(sab, OP.ECHO, new Uint8Array(5))).toThrow(
      /exceeds capacity/,
    );
  });
});
```

- [x] **Step 2: Run it to confirm it fails**

Run: `pnpm -F @local/yt-dlp-wasm test`
Expected: FAIL — `sab.ts` does not export `createSab`/`writeRequest`/etc.

- [x] **Step 3: Write the frame helpers in `sab.ts`**

```ts
import { CTRL_BYTES, SLOT, STATE } from "../client/protocol";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Allocate a SharedArrayBuffer: control region + `dataCapacity` payload bytes. */
export function createSab(dataCapacity: number): SharedArrayBuffer {
  return new SharedArrayBuffer(CTRL_BYTES + dataCapacity);
}

function views(sab: SharedArrayBuffer): { ctrl: Int32Array; data: Uint8Array } {
  return {
    ctrl: new Int32Array(sab, 0, CTRL_BYTES / 4),
    data: new Uint8Array(sab, CTRL_BYTES),
  };
}

/** Write a request frame (op + payload) and mark STATE=REQUEST. Returns the request id. */
export function writeRequest(
  sab: SharedArrayBuffer,
  op: number,
  payload: Uint8Array,
): number {
  const { ctrl, data } = views(sab);
  if (payload.byteLength > data.byteLength) {
    throw new RangeError(
      `payload ${payload.byteLength} exceeds capacity ${data.byteLength}`,
    );
  }
  data.set(payload, 0);
  const reqId = Atomics.add(ctrl, SLOT.REQ_ID, 1) + 1;
  Atomics.store(ctrl, SLOT.OP, op);
  Atomics.store(ctrl, SLOT.LEN, payload.byteLength);
  Atomics.store(ctrl, SLOT.STATE, STATE.REQUEST);
  return reqId;
}

/** Read the pending request frame (copies the payload out of the shared buffer). */
export function readRequest(sab: SharedArrayBuffer): {
  op: number;
  payload: Uint8Array;
} {
  const { ctrl, data } = views(sab);
  const op = Atomics.load(ctrl, SLOT.OP);
  const len = Atomics.load(ctrl, SLOT.LEN);
  return { op, payload: data.slice(0, len) };
}

/** Write a response (or error) frame and notify a parked requester. */
export function writeResponse(
  sab: SharedArrayBuffer,
  payload: Uint8Array,
  errored = false,
): void {
  const { ctrl, data } = views(sab);
  if (payload.byteLength > data.byteLength) {
    throw new RangeError(
      `response ${payload.byteLength} exceeds capacity ${data.byteLength}`,
    );
  }
  data.set(payload, 0);
  Atomics.store(ctrl, SLOT.LEN, payload.byteLength);
  Atomics.store(ctrl, SLOT.STATE, errored ? STATE.ERROR : STATE.RESPONSE);
  Atomics.notify(ctrl, SLOT.STATE);
}

/** Read the response frame and reset to IDLE; throws if it is an error frame. */
export function readResponse(sab: SharedArrayBuffer): Uint8Array {
  const { ctrl, data } = views(sab);
  const len = Atomics.load(ctrl, SLOT.LEN);
  const out = data.slice(0, len);
  const errored = Atomics.load(ctrl, SLOT.STATE) === STATE.ERROR;
  Atomics.store(ctrl, SLOT.STATE, STATE.IDLE);
  if (errored) throw new Error(decoder.decode(out));
  return out;
}

export { encoder as _encoder, decoder as _decoder };
```

- [x] **Step 4: Run tests to confirm they pass**

Run: `pnpm -F @local/yt-dlp-wasm test`
Expected: PASS (4 tests).

- [x] **Step 5: Commit**

```bash
git add packages/yt-dlp-wasm/src/bridge/sab.ts packages/yt-dlp-wasm/src/bridge/sab.test.ts
git commit -m "feat(yt-dlp-wasm): SAB frame read/write helpers"
```

---

## Task 4: Blocking requester/responder (`sab.ts`) — TDD

The requester blocks on `Atomics.wait`; the responder is driven by a wake callback (not `Atomics.wait`) so its event loop stays free for async work. We test the orchestration deterministically by making `wake` run an instantaneous responder, so `call()` finds `STATE !== REQUEST` and never has to block (a true cross-thread block is smoke-proven in Task 6).

**Files:**
- Modify: `packages/yt-dlp-wasm/src/bridge/sab.ts`
- Modify: `packages/yt-dlp-wasm/src/bridge/sab.test.ts`

- [x] **Step 1: Add failing tests for `SabRequester`/`SabResponder`**

Append to `sab.test.ts`:

```ts
import { SabRequester, SabResponder } from "./sab";

describe("SabRequester / SabResponder", () => {
  it("call() returns a synchronously-produced response", () => {
    const sab = createSab(1024);
    // Responder transforms bytes by +1; wake runs it inline (instantaneous).
    const responder = new SabResponder(sab, (_op, payload) =>
      Uint8Array.from(payload, (b) => b + 1),
    );
    const requester = new SabRequester(sab, () => responder.handleSync());
    const out = requester.call(OP.ECHO, new Uint8Array([1, 2, 3]));
    expect(Array.from(out)).toEqual([2, 3, 4]);
  });

  it("callText() encodes/decodes UTF-8", () => {
    const sab = createSab(1024);
    const responder = new SabResponder(sab, (_op, payload) =>
      Uint8Array.from(payload, (b) => (b >= 97 && b <= 122 ? b - 32 : b)),
    );
    const requester = new SabRequester(sab, () => responder.handleSync());
    expect(requester.callText(OP.ECHO, "hello")).toBe("HELLO");
  });

  it("call() throws when the handler throws", () => {
    const sab = createSab(1024);
    const responder = new SabResponder(sab, () => {
      throw new Error("nope");
    });
    const requester = new SabRequester(sab, () => responder.handleSync());
    expect(() => requester.callText(OP.ECHO, "x")).toThrow("nope");
  });
});
```

- [x] **Step 2: Run to confirm failure**

Run: `pnpm -F @local/yt-dlp-wasm test`
Expected: FAIL — `SabRequester`/`SabResponder` not exported.

- [x] **Step 3: Implement the classes in `sab.ts`**

Append to `sab.ts`:

```ts
import { SLOT, STATE } from "../client/protocol";

type Handler = (op: number, payload: Uint8Array) => Promise<Uint8Array> | Uint8Array;

/**
 * Requester side. MUST run on a worker thread (Atomics.wait is illegal on the
 * main thread). `wake` nudges the responder's event loop (e.g. port.postMessage)
 * so it can run async work while this thread parks on Atomics.wait.
 */
export class SabRequester {
  private readonly ctrl: Int32Array;
  constructor(
    private readonly sab: SharedArrayBuffer,
    private readonly wake: (reqId: number) => void,
  ) {
    this.ctrl = new Int32Array(sab, 0, CTRL_BYTES / 4);
  }

  call(op: number, payload: Uint8Array): Uint8Array {
    const reqId = writeRequest(this.sab, op, payload);
    this.wake(reqId);
    while (Atomics.load(this.ctrl, SLOT.STATE) === STATE.REQUEST) {
      Atomics.wait(this.ctrl, SLOT.STATE, STATE.REQUEST);
    }
    return readResponse(this.sab);
  }

  callText(op: number, text: string): string {
    return decoder.decode(this.call(op, encoder.encode(text)));
  }
}

/**
 * Responder side. Driven by the wake signal (NOT Atomics.wait) so its event loop
 * stays free for async work (libcurl, ffmpeg.wasm). Call `handle` from the wake
 * message handler in production; `handleSync` exists for synchronous handlers/tests.
 */
export class SabResponder {
  constructor(
    private readonly sab: SharedArrayBuffer,
    private readonly handler: Handler,
  ) {}

  async handle(): Promise<void> {
    const { op, payload } = readRequest(this.sab);
    try {
      writeResponse(this.sab, await this.handler(op, payload), false);
    } catch (err) {
      writeResponse(this.sab, encoder.encode(messageOf(err)), true);
    }
  }

  handleSync(): void {
    const { op, payload } = readRequest(this.sab);
    try {
      const resp = this.handler(op, payload);
      if (resp instanceof Promise) {
        throw new TypeError("handleSync requires a synchronous handler");
      }
      writeResponse(this.sab, resp, false);
    } catch (err) {
      writeResponse(this.sab, encoder.encode(messageOf(err)), true);
    }
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
```

- [x] **Step 4: Run tests to confirm all pass**

Run: `pnpm -F @local/yt-dlp-wasm test`
Expected: PASS (7 tests total).

- [x] **Step 5: Typecheck**

Run: `pnpm -F @local/yt-dlp-wasm typecheck`
Expected: no errors.

- [x] **Step 6: Commit**

```bash
git add packages/yt-dlp-wasm/src/bridge/sab.ts packages/yt-dlp-wasm/src/bridge/sab.test.ts
git commit -m "feat(yt-dlp-wasm): blocking SabRequester + SabResponder"
```

---

## Task 5: Worker stubs, controller, build

**Files:**
- Create: `packages/yt-dlp-wasm/src/services-worker/worker.ts`
- Create: `packages/yt-dlp-wasm/src/pyodide-worker/worker.ts`
- Create: `packages/yt-dlp-wasm/src/client/controller.ts`
- Create: `packages/yt-dlp-wasm/src/index.ts`
- Create: `packages/yt-dlp-wasm/build.mjs`

- [x] **Step 1: Write the services worker (responder stub)**

`src/services-worker/worker.ts`:

```ts
/// <reference lib="webworker" />
import { SabResponder } from "../bridge/sab";

declare const self: DedicatedWorkerGlobalScope;

let responder: SabResponder | undefined;

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg?.type === "init") {
    const wakePort: MessagePort = msg.wakePort;
    // Phase 1 ECHO: uppercase ASCII bytes to prove transforms round-trip.
    responder = new SabResponder(msg.sab as SharedArrayBuffer, (_op, payload) =>
      Uint8Array.from(payload, (b) => (b >= 97 && b <= 122 ? b - 32 : b)),
    );
    wakePort.onmessage = () => {
      void responder?.handle();
    };
  }
};
```

- [x] **Step 2: Write the Pyodide worker (requester stub)**

`src/pyodide-worker/worker.ts`:

```ts
/// <reference lib="webworker" />
import { SabRequester } from "../bridge/sab";
import { OP } from "../client/protocol";

declare const self: DedicatedWorkerGlobalScope;

let requester: SabRequester | undefined;

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg?.type === "init") {
    const wakePort: MessagePort = msg.wakePort;
    requester = new SabRequester(msg.sab as SharedArrayBuffer, (reqId) =>
      wakePort.postMessage(reqId),
    );
  } else if (msg?.type === "ping" && requester) {
    // Blocks this worker thread on Atomics.wait until the responder answers.
    const text = requester.callText(OP.ECHO, msg.text);
    self.postMessage({ type: "pong", text });
  }
};
```

- [x] **Step 3: Write the controller**

`src/client/controller.ts`:

```ts
import { createSab } from "../bridge/sab";

export interface YtDlpConfig {
  /** SAB data-region capacity in bytes. Phase 1 default 16 MiB. */
  dataCapacity?: number;
}

export interface YtDlp {
  /** ECHO round-trip through the sync bridge; returns the uppercased text. */
  ping(text: string): Promise<string>;
  terminate(): void;
}

export function createYtDlp(config: YtDlpConfig = {}): YtDlp {
  const sab = createSab(config.dataCapacity ?? 16 * 1024 * 1024);

  const pyodideWorker = new Worker(
    new URL("../pyodide-worker/worker.js", import.meta.url),
    { type: "module" },
  );
  const servicesWorker = new Worker(
    new URL("../services-worker/worker.js", import.meta.url),
    { type: "module" },
  );

  const channel = new MessageChannel();
  pyodideWorker.postMessage({ type: "init", sab, wakePort: channel.port1 }, [
    channel.port1,
  ]);
  servicesWorker.postMessage({ type: "init", sab, wakePort: channel.port2 }, [
    channel.port2,
  ]);

  return {
    ping(text: string): Promise<string> {
      return new Promise((resolve) => {
        const onMsg = (e: MessageEvent) => {
          if (e.data?.type === "pong") {
            pyodideWorker.removeEventListener("message", onMsg);
            resolve(e.data.text as string);
          }
        };
        pyodideWorker.addEventListener("message", onMsg);
        pyodideWorker.postMessage({ type: "ping", text });
      });
    },
    terminate(): void {
      pyodideWorker.terminate();
      servicesWorker.terminate();
    },
  };
}
```

- [x] **Step 4: Write the public entry**

`src/index.ts`:

```ts
export { createYtDlp } from "./client/controller";
export type { YtDlp, YtDlpConfig } from "./client/controller";
export { OP, STATE } from "./client/protocol";
```

- [x] **Step 5: Write the esbuild build script**

`build.mjs`:

```js
import { build, context } from "esbuild";

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: {
    index: "src/index.ts",
    "pyodide-worker/worker": "src/pyodide-worker/worker.ts",
    "services-worker/worker": "src/services-worker/worker.ts",
  },
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  splitting: false,
  sourcemap: true,
  // Heavy runtimes load at runtime from CDN / dynamic import; keep them external.
  external: [
    "pyodide",
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "@ffmpeg/core-mt",
    "libcurl.js",
  ],
};

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("yt-dlp-wasm: esbuild watching…");
} else {
  await build(options);
  console.log("yt-dlp-wasm: build complete");
}
```

- [x] **Step 6: Build + typecheck**

Run: `pnpm -F @local/yt-dlp-wasm build`
Expected: `dist/index.js`, `dist/pyodide-worker/worker.js`, `dist/services-worker/worker.js`, and matching `.d.ts` files exist; no TS errors.

Run: `ls packages/yt-dlp-wasm/dist packages/yt-dlp-wasm/dist/pyodide-worker packages/yt-dlp-wasm/dist/services-worker`
Expected: the three `.js` files (+ `.js.map`) and `index.d.ts` present.

- [x] **Step 7: Lint**

Run: `pnpm -F @local/yt-dlp-wasm lint`
Expected: Biome reports no errors (formatting already matches; run `biome format --write` from the package dir if needed).

- [x] **Step 8: Commit**

```bash
git add packages/yt-dlp-wasm/src packages/yt-dlp-wasm/build.mjs
git commit -m "feat(yt-dlp-wasm): worker stubs, controller, esbuild build"
```

---

## Task 6: Cross-thread smoke proof (the de-risk gate)

Proves the real mechanism: one `SharedArrayBuffer` shared by two Web Workers, wake over a `MessageChannel`, requester parks on `Atomics.wait`, responder transforms and notifies — all under cross-origin isolation. `SharedArrayBuffer` is only available when the page is cross-origin isolated, so the harness server sends COOP/COEP.

**Files:**
- Create: `packages/yt-dlp-wasm/test-harness/index.html`
- Create: `packages/yt-dlp-wasm/test-harness/serve.mjs`

- [x] **Step 1: Write the test page**

`test-harness/index.html`:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>yt-dlp-wasm sync-bridge smoke</title>
  </head>
  <body>
    <pre id="out">running…</pre>
    <script type="module">
      import { createYtDlp } from "../dist/index.js";
      const out = document.getElementById("out");
      try {
        if (!self.crossOriginIsolated) throw new Error("not cross-origin isolated");
        const ytdlp = createYtDlp({ dataCapacity: 1024 });
        const result = await ytdlp.ping("hello world");
        out.textContent =
          result === "HELLO WORLD" ? "ECHO OK: " + result : "ECHO MISMATCH: " + result;
        ytdlp.terminate();
      } catch (err) {
        out.textContent = "ERROR: " + (err?.message ?? err);
      }
    </script>
  </body>
</html>
```

- [x] **Step 2: Write the COOP/COEP static server**

`test-harness/serve.mjs`:

```js
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname; // packages/yt-dlp-wasm
const PORT = 8787;
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".map": "application/json",
  ".wasm": "application/wasm",
};

createServer(async (req, res) => {
  // Cross-origin isolation — required for SharedArrayBuffer.
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  const urlPath = req.url === "/" ? "/test-harness/index.html" : req.url;
  const filePath = normalize(join(ROOT, decodeURIComponent(urlPath.split("?")[0])));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(filePath);
    res.setHeader("Content-Type", MIME[extname(filePath)] ?? "application/octet-stream");
    res.writeHead(200).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => console.log(`harness: http://localhost:${PORT}`));
```

- [x] **Step 3: Ensure a fresh build exists**

Run: `pnpm -F @local/yt-dlp-wasm build`
Expected: build completes.

- [x] **Step 4: Start the harness server**

Run (background): `node packages/yt-dlp-wasm/test-harness/serve.mjs`
Expected: logs `harness: http://localhost:8787`.

- [x] **Step 5: Drive the page and assert the result**

Use the Playwright MCP (or chrome-devtools MCP) to navigate to `http://localhost:8787` and read the `#out` text.
Expected: `ECHO OK: HELLO WORLD`.

If it instead shows `ERROR: not cross-origin isolated`, the COOP/COEP headers aren't reaching the browser — recheck `serve.mjs` headers. If it hangs on `running…`, the requester is stuck in `Atomics.wait` (responder never notified) — verify both workers received `init` and the `wakePort` is transferred to both.

- [x] **Step 6: Stop the server and commit**

Stop the background server.

```bash
git add packages/yt-dlp-wasm/test-harness
git commit -m "test(yt-dlp-wasm): cross-thread sync-bridge smoke harness"
```

---

## Self-Review (against the spec)

- **Three-context layout** (`client/`, `pyodide-worker/`, `services-worker/`, `bridge/`): created in Tasks 2–5. ✅ (Pyodide/ffmpeg/libcurl bodies are stubbed — that's Phases 2–4.)
- **SAB + Atomics sync bridge** (spec §"The sync bridge", constraint #3): Tasks 3–4 (logic, unit-tested) + Task 6 (real cross-thread proof). ✅
- **Wake-via-message, not Atomics, on the responder** (so its loop stays free for async work): encoded in `SabResponder.handle` + the `MessageChannel` wiring. ✅
- **esbuild build with worker entries + externals for heavy runtimes** (spec §"Build & deps"): Task 5. ✅
- **Chunking/streaming for oversized payloads**: intentionally deferred to Phase 4 (networking), where it's needed; Phase 1 throws on oversize (explicit, not a placeholder). Tracked in Roadmap.
- **Placeholder scan**: no TBD/TODO; every code step is complete and runnable.
- **Type consistency**: `createSab`, `writeRequest`, `readRequest`, `writeResponse`, `readResponse`, `SabRequester.call/callText`, `SabResponder.handle/handleSync`, `OP.ECHO`, `SLOT.*`, `STATE.*` are used identically across `protocol.ts`, `sab.ts`, the workers, and the tests.

---

## Roadmap — subsequent plans (each gets its own detailed plan)

These are **not** implementation steps yet; their details depend on what Phase 1 (and each predecessor) proves. Each will be expanded into a full TDD plan when reached.

- **Phase 2 — Pyodide + yt-dlp loader.** In `pyodide-worker/worker.ts`: load Pyodide from jsDelivr (`indexURL`), load yt-dlp via configurable source (default `micropip.install('yt-dlp')`). Capstone: a real synchronous bridge call issued *from Python* (proves sync-over-async from yt-dlp's perspective). Adds `OP` for FS reads.
- **Phase 3 — ffmpeg bridge.** In `services-worker/`: load `@ffmpeg/core-mt` via `toBlobURL`; `ffmpeg.ts` cross-FS staging; Python `subprocess_shim.py` (Popen/run/check_output → `OP.FFMPEG_EXEC`) + `ffprobe_compat.py` (synthesize ffprobe JSON from `ffmpeg -i` stderr); handle `-version` probes.
- **Phase 4 — networking.** `net.ts` streaming HTTP over libcurl.js/Wisp; Python `network_handler.py` custom yt-dlp `RequestHandler` → `OP.NET_SEND`. Introduces **chunked/streaming** SAB reads (`read(reqId, offset, n)`) for large bodies.
- **Phase 5 — public API.** `extractInfo` / `download` (Python `YoutubeDL` API) and `exec(argv)` (real CLI entrypoint); `progress`/`log` events; read output files out of MEMFS `/work`.
- **Phase 6 — integration.** Wire into the Next app behind COOP/COEP (`next.config.ts`), point `wispUrl` at the standalone Wisp service, e2e smoke against one short real video, docs (memory/risk caveats: YouTube bot defenses, memory ceiling).
