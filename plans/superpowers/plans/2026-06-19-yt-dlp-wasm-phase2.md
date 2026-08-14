# yt-dlp-wasm — Phase 2 Implementation Plan (Pyodide + yt-dlp loader)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the Pyodide-worker stub with a real Pyodide runtime that loads from the jsDelivr CDN, installs yt-dlp from a configurable source, and proves the synchronous bridge works **from Python** — i.e. Python code calls into the SAB bridge (blocking on `Atomics.wait`) and gets a result back, which is the architectural crux for yt-dlp's blocking `urllib`/`subprocess`.

**Architecture:** Builds directly on Phase 1. The Pyodide worker boots `loadPyodide` from `${indexURL}pyodide.mjs` (runtime CDN import), registers a JS module (`ytdlp_bridge_js`) whose `call()` invokes the Phase-1 `SabRequester` (blocking the worker thread on `Atomics.wait`), runs a small Python wrapper (`bridge.py`) that marshals `bytes`↔`Uint8Array`, then `micropip.install`s yt-dlp. The controller gains `load()`, `ytDlpVersion()`, and `pyEcho()`.

**Tech Stack:** Pyodide (loaded from jsDelivr at runtime; `pyodide` as a dev-only type dependency), micropip, esbuild `.py` text loader, Vitest (pure-helper units), Playwright MCP (capstone browser smoke). Prereq: Phase 1 merged/usable (`@local/yt-dlp-wasm` with the SAB bridge). Spec: `plans/superpowers/specs/2026-06-19-yt-dlp-wasm-design.md`.

**Scope note:** Phase 2 loads Pyodide + yt-dlp and proves the Python→bridge path with the existing ECHO op. It does NOT do extraction/download (needs Phase 4 networking) or ffmpeg (Phase 3). No new opcodes are added — ECHO is reused to prove the path end-to-end.

---

## Key risks (read before implementing)

1. **micropip under cross-origin isolation.** The SAB bridge requires COOP/COEP (`require-corp`). Under that, `micropip.install("yt-dlp")` fetching wheels from `files.pythonhosted.org` may fail if those responses lack `Cross-Origin-Resource-Policy`. **Mitigation used here:** the capstone smoke installs yt-dlp from a **self-hosted wheel** in `public/` via `ytDlpSource: { url }` with `deps=False` (a bare `import yt_dlp` + version read needs no optional deps). `"micropip"` from PyPI stays the *default* for non-isolated contexts and for Phase 4, when libcurl-over-Wisp can proxy wheel fetches.
2. **bytes marshalling.** `to_js(bytes)` is expected to yield a `Uint8Array` (copy) and a returned JS `Uint8Array` `.to_py()` a `memoryview`. If a Pyodide version differs, the fallback (documented in Task 2) is to pass the buffer through `.to_js()`/`.to_py({create_pyproxies:false})` explicitly. The Task 4 smoke catches this.
3. **Pyodide version pinning.** `PYODIDE_VERSION` (Task 1) MUST equal the installed `pyodide` devDependency, or the CDN assets won't match the TS types. Set it from the lockfile after install.
4. **Boot time / network.** Booting downloads ~10 MB (Pyodide) + the yt-dlp wheel. The smoke is a manual/gated browser test, not CI.

---

## File Structure (Phase 2)

| File | Responsibility | New/Changed |
| --- | --- | --- |
| `packages/yt-dlp-wasm/src/pyodide-worker/config.ts` | Pure config helpers (indexURL, yt-dlp source) + `PYODIDE_VERSION` | new |
| `packages/yt-dlp-wasm/src/pyodide-worker/config.test.ts` | Unit tests for the helpers | new |
| `packages/yt-dlp-wasm/src/pyodide-worker/py/bridge.py` | Python wrapper marshalling bytes↔Uint8Array over the JS bridge | new |
| `packages/yt-dlp-wasm/src/pyodide-worker/boot.ts` | Boot Pyodide, register bridge, run bridge.py, install yt-dlp | new |
| `packages/yt-dlp-wasm/src/pyodide-worker/worker.ts` | Boot on init; handle `ping`/`py-echo`; emit `ready`/`boot-error` | changed |
| `packages/yt-dlp-wasm/src/client/controller.ts` | `load()`, `ytDlpVersion()`, `pyEcho()`, config plumbing | changed |
| `packages/yt-dlp-wasm/src/index.ts` | Export new config types | changed |
| `packages/yt-dlp-wasm/build.mjs` | Add `.py` text loader | changed |
| `packages/yt-dlp-wasm/package.json` | Add `pyodide` devDependency | changed |
| `src/app/yt-dlp-test/page.tsx` | Add "Boot Pyodide + yt-dlp" panel | changed |
| `.scripts/fetch-yt-dlp-wheel.mjs` | Download a yt-dlp wheel into `public/` for the smoke | new |

---

## Task 1: Config helpers + pyodide types dep (TDD)

**Files:**
- Modify: `packages/yt-dlp-wasm/package.json`
- Create: `packages/yt-dlp-wasm/src/pyodide-worker/config.ts`
- Test: `packages/yt-dlp-wasm/src/pyodide-worker/config.test.ts`

- [x] **Step 1: Add the `pyodide` devDependency**

Run: `pnpm -F @local/yt-dlp-wasm add -D pyodide`
Then read the installed version:
Run: `node -e "console.log(require('./packages/yt-dlp-wasm/node_modules/pyodide/package.json').version)"`
Note that exact version — it becomes `PYODIDE_VERSION` below.

- [x] **Step 2: Write the failing test** — `config.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  PYODIDE_VERSION,
  resolvePyodideIndexURL,
  resolveYtDlpInstall,
} from "./config";

describe("resolvePyodideIndexURL", () => {
  it("defaults to the jsDelivr CDN for the pinned version", () => {
    expect(resolvePyodideIndexURL()).toBe(
      `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
    );
  });

  it("honors an override and guarantees a trailing slash", () => {
    expect(resolvePyodideIndexURL({ pyodideIndexURL: "https://x/y" })).toBe(
      "https://x/y/",
    );
    expect(resolvePyodideIndexURL({ pyodideIndexURL: "https://x/y/" })).toBe(
      "https://x/y/",
    );
  });
});

describe("resolveYtDlpInstall", () => {
  it("defaults to micropip yt-dlp", () => {
    expect(resolveYtDlpInstall()).toEqual({ kind: "micropip", spec: "yt-dlp" });
    expect(resolveYtDlpInstall("micropip")).toEqual({
      kind: "micropip",
      spec: "yt-dlp",
    });
  });

  it("supports a URL source", () => {
    expect(resolveYtDlpInstall({ url: "https://r2/yt_dlp.whl" })).toEqual({
      kind: "url",
      url: "https://r2/yt_dlp.whl",
    });
  });
});
```

- [x] **Step 3: Run it to confirm failure**

Run: `pnpm -F @local/yt-dlp-wasm test`
Expected: FAIL — `./config` not found.

- [x] **Step 4: Write `config.ts`** (set `PYODIDE_VERSION` to the version from Step 1)

```ts
// Pure configuration helpers for the Pyodide worker. No DOM/worker globals and
// no .py imports — safe to unit-test under vitest (node).

/**
 * Pinned Pyodide version. MUST match the `pyodide` devDependency so the CDN
 * assets loaded at runtime match the TypeScript types compiled against.
 */
export const PYODIDE_VERSION = "0.28.3"; // <- set to the version from Step 1

export type YtDlpSource = "micropip" | { url: string };

export interface PyodideBootConfig {
  /** Override the Pyodide asset base URL. Default: jsDelivr CDN for PYODIDE_VERSION. */
  pyodideIndexURL?: string;
  /** Where to load yt-dlp from. Default: micropip from PyPI/jsDelivr. */
  ytDlpSource?: YtDlpSource;
}

/** Resolve the Pyodide `indexURL` (asset base; always ends with a slash). */
export function resolvePyodideIndexURL(config: PyodideBootConfig = {}): string {
  const override = config.pyodideIndexURL;
  if (override) return override.endsWith("/") ? override : `${override}/`;
  return `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
}

export type YtDlpInstall =
  | { kind: "micropip"; spec: string }
  | { kind: "url"; url: string };

/** Resolve how to install yt-dlp inside Pyodide. */
export function resolveYtDlpInstall(
  source: YtDlpSource = "micropip",
): YtDlpInstall {
  if (source === "micropip") return { kind: "micropip", spec: "yt-dlp" };
  return { kind: "url", url: source.url };
}
```

- [x] **Step 5: Run tests to confirm pass**

Run: `pnpm -F @local/yt-dlp-wasm test`
Expected: PASS (the Phase-1 tests + 4 new).

- [x] **Step 6: Commit**

```bash
git add packages/yt-dlp-wasm/src/pyodide-worker/config.ts packages/yt-dlp-wasm/src/pyodide-worker/config.test.ts packages/yt-dlp-wasm/package.json pnpm-lock.yaml
git commit -m "feat(yt-dlp-wasm): pyodide boot config helpers"
```

---

## Task 2: Python bridge wrapper + boot module

No automated test here (requires a live Pyodide runtime); verified by the Task 4 smoke. Keep the code minimal and exact.

**Files:**
- Modify: `packages/yt-dlp-wasm/build.mjs`
- Create: `packages/yt-dlp-wasm/src/pyodide-worker/py/bridge.py`
- Create: `packages/yt-dlp-wasm/src/pyodide-worker/boot.ts`

- [x] **Step 1: Add the `.py` text loader to `build.mjs`**

Add `loader: { ".py": "text" }` to the esbuild `options` object (so `import x from "./py/bridge.py"` yields the file contents as a string). The full options object becomes:

```js
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
  loader: { ".py": "text" },
  external: [
    "pyodide",
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "@ffmpeg/core-mt",
    "libcurl.js",
  ],
};
```

- [x] **Step 2: Write `src/pyodide-worker/py/bridge.py`**

```python
"""Bridge between yt-dlp's synchronous Python world and the JS sync bridge.

`ytdlp_bridge_js` is a JS module registered by the worker; its `call(op, u8)`
performs a synchronous SharedArrayBuffer round-trip (the JS side blocks on
Atomics.wait). Marshalling: Python bytes -> JS Uint8Array via to_js; the JS
result (a Uint8Array) -> Python bytes via .to_py().
"""

from pyodide.ffi import to_js
import ytdlp_bridge_js

OP_ECHO = 1


def call(op: int, data: bytes) -> bytes:
    result = ytdlp_bridge_js.call(op, to_js(data))
    return bytes(result.to_py())


def echo(text: str) -> str:
    return call(OP_ECHO, text.encode()).decode()
```

- [x] **Step 3: Write `src/pyodide-worker/boot.ts`**

```ts
import type { PyodideInterface } from "pyodide";
import type { SabRequester } from "../bridge/sab";
// Inlined at build via esbuild's .py text loader (see build.mjs).
import bridgePy from "./py/bridge.py";
import {
  type PyodideBootConfig,
  resolvePyodideIndexURL,
  resolveYtDlpInstall,
} from "./config";

export interface PyodideRuntime {
  pyodide: PyodideInterface;
  ytDlpVersion: string;
}

export async function bootPyodide(
  config: PyodideBootConfig,
  requester: SabRequester,
): Promise<PyodideRuntime> {
  const indexURL = resolvePyodideIndexURL(config);

  // Load the loader from the CDN at runtime. A computed specifier keeps the
  // bundler from resolving it; it is a cross-origin ESM (jsDelivr sends CORS,
  // so it is COEP-compatible).
  const loaderUrl = `${indexURL}pyodide.mjs`;
  const { loadPyodide } = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ loaderUrl
  )) as {
    loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInterface>;
  };

  const pyodide = await loadPyodide({ indexURL });

  // Expose the synchronous bridge to Python. `call` blocks THIS worker thread
  // on Atomics.wait until the services worker answers — legal off-main-thread.
  pyodide.registerJsModule("ytdlp_bridge_js", {
    call: (op: number, payload: Uint8Array): Uint8Array =>
      requester.call(op, payload),
  });
  pyodide.runPython(bridgePy);

  // Install yt-dlp. micropip from PyPI is the default; a URL source installs a
  // single wheel with deps disabled (enough for `import yt_dlp` + version).
  await pyodide.loadPackage("micropip");
  const install = resolveYtDlpInstall(config.ytDlpSource);
  pyodide.globals.set("_yt_dlp_spec", install.kind === "url" ? install.url : install.spec);
  await pyodide.runPythonAsync(
    install.kind === "url"
      ? "import micropip; await micropip.install(_yt_dlp_spec, deps=False)"
      : "import micropip; await micropip.install(_yt_dlp_spec)",
  );

  const ytDlpVersion = pyodide.runPython(
    "import yt_dlp; yt_dlp.version.__version__",
  ) as string;

  return { pyodide, ytDlpVersion };
}
```

Marshalling fallback (only if the Task 4 smoke shows a bytes conversion error): in `bridge.py`, replace `bytes(result.to_py())` with `result.to_py().tobytes()` (memoryview → bytes), and/or replace `to_js(data)` with `to_js(data, create_pyproxies=False)`.

- [x] **Step 4: Build to confirm it compiles and inlines the .py**

Run: `pnpm -F @local/yt-dlp-wasm build`
Expected: build completes. Confirm the Python source is inlined:
Run: `grep -c "ytdlp_bridge_js" packages/yt-dlp-wasm/dist/pyodide-worker/worker.js`
Expected: ≥ 1 once Task 3 wires `worker.ts` to `boot.ts`. (After this task alone, `boot.ts` isn't imported by an entry yet, so it may be 0 — that's fine; the real check is in Task 3.) Also run `pnpm -F @local/yt-dlp-wasm typecheck` → clean.

- [x] **Step 5: Commit**

```bash
git add packages/yt-dlp-wasm/build.mjs packages/yt-dlp-wasm/src/pyodide-worker/py/bridge.py packages/yt-dlp-wasm/src/pyodide-worker/boot.ts
git commit -m "feat(yt-dlp-wasm): pyodide boot + python bridge wrapper"
```

---

## Task 3: Worker lifecycle + controller API

**Files:**
- Modify: `packages/yt-dlp-wasm/src/pyodide-worker/worker.ts`
- Modify: `packages/yt-dlp-wasm/src/client/controller.ts`
- Modify: `packages/yt-dlp-wasm/src/index.ts`

- [x] **Step 1: Rewrite `src/pyodide-worker/worker.ts`**

```ts
/// <reference lib="webworker" />
import { SabRequester } from "../bridge/sab";
import { OP } from "../client/protocol";
import { bootPyodide, type PyodideRuntime } from "./boot";
import type { PyodideBootConfig } from "./config";

declare const self: DedicatedWorkerGlobalScope;

let requester: SabRequester | undefined;
let runtime: Promise<PyodideRuntime> | undefined;

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg?.type === "init") {
    const wakePort: MessagePort = msg.wakePort;
    requester = new SabRequester(msg.sab as SharedArrayBuffer, (reqId) =>
      wakePort.postMessage(reqId),
    );
    runtime = bootPyodide((msg.config ?? {}) as PyodideBootConfig, requester);
    runtime.then(
      (rt) => self.postMessage({ type: "ready", ytDlpVersion: rt.ytDlpVersion }),
      (err) => self.postMessage({ type: "boot-error", message: messageOf(err) }),
    );
  } else if (msg?.type === "ping" && requester) {
    // Direct (non-Python) bridge round-trip — does not require Pyodide.
    self.postMessage({ type: "pong", text: requester.callText(OP.ECHO, msg.text) });
  } else if (msg?.type === "py-echo") {
    void handlePyEcho(msg.text as string);
  }
};

async function handlePyEcho(text: string): Promise<void> {
  try {
    const { pyodide } = await runtime!;
    pyodide.globals.set("_echo_in", text);
    const result = pyodide.runPython("echo(_echo_in)") as string;
    self.postMessage({ type: "py-echo-result", text: result });
  } catch (err) {
    self.postMessage({ type: "py-echo-result", error: messageOf(err) });
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
```

- [x] **Step 2: Update `src/client/controller.ts`**

Replace the file with:

```ts
import type { PyodideBootConfig } from "../pyodide-worker/config";
import { createSab } from "../bridge/sab";

export interface YtDlpConfig extends PyodideBootConfig {
  /** SAB data-region capacity in bytes. Default 16 MiB. */
  dataCapacity?: number;
}

export interface YtDlp {
  /** Resolves once Pyodide + yt-dlp finish loading; rejects on boot failure. */
  load(): Promise<{ ytDlpVersion: string }>;
  /** Direct (non-Python) ECHO round-trip through the sync bridge. */
  ping(text: string): Promise<string>;
  /** yt-dlp version string (available after load()). */
  ytDlpVersion(): Promise<string>;
  /** ECHO round-trip routed THROUGH Python (proves the Python→bridge path). */
  pyEcho(text: string): Promise<string>;
  terminate(): void;
}

function spawnWorker(name: "pyodide-worker" | "services-worker"): Worker {
  const url = new URL(`./${name}/worker.js`, import.meta.url);
  return new Worker(url, { type: "module" });
}

export function createYtDlp(config: YtDlpConfig = {}): YtDlp {
  const { dataCapacity, ...bootConfig } = config;
  const sab = createSab(dataCapacity ?? 16 * 1024 * 1024);

  const pyodideWorker = spawnWorker("pyodide-worker");
  const servicesWorker = spawnWorker("services-worker");

  // Attach the readiness listener BEFORE posting init so `ready` can't race us.
  let resolveReady: (v: { ytDlpVersion: string }) => void;
  let rejectReady: (e: Error) => void;
  const ready = new Promise<{ ytDlpVersion: string }>((res, rej) => {
    resolveReady = res;
    rejectReady = rej;
  });
  pyodideWorker.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "ready") resolveReady({ ytDlpVersion: e.data.ytDlpVersion });
    else if (e.data?.type === "boot-error") rejectReady(new Error(e.data.message));
  });

  const channel = new MessageChannel();
  pyodideWorker.postMessage(
    { type: "init", sab, wakePort: channel.port1, config: bootConfig },
    [channel.port1],
  );
  servicesWorker.postMessage({ type: "init", sab, wakePort: channel.port2 }, [
    channel.port2,
  ]);

  function once<T>(type: string, post: () => void, pick: (data: any) => T): Promise<T> {
    return new Promise((resolve, reject) => {
      const onMsg = (e: MessageEvent) => {
        if (e.data?.type === type) {
          pyodideWorker.removeEventListener("message", onMsg);
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(pick(e.data));
        }
      };
      pyodideWorker.addEventListener("message", onMsg);
      post();
    });
  }

  return {
    load: () => ready,
    ytDlpVersion: () => ready.then((r) => r.ytDlpVersion),
    ping: (text) =>
      once<string>(
        "pong",
        () => pyodideWorker.postMessage({ type: "ping", text }),
        (d) => d.text,
      ),
    pyEcho: (text) =>
      once<string>(
        "py-echo-result",
        () => pyodideWorker.postMessage({ type: "py-echo", text }),
        (d) => d.text,
      ),
    terminate() {
      pyodideWorker.terminate();
      servicesWorker.terminate();
    },
  };
}
```

- [x] **Step 3: Update `src/index.ts`**

```ts
export { createYtDlp } from "./client/controller";
export type { YtDlp, YtDlpConfig } from "./client/controller";
export type { PyodideBootConfig, YtDlpSource } from "./pyodide-worker/config";
export { OP, STATE } from "./client/protocol";
```

- [x] **Step 4: Build, typecheck, lint, test**

Run each; all must be green:
- `pnpm -F @local/yt-dlp-wasm build` → completes; `grep -c "ytdlp_bridge_js" packages/yt-dlp-wasm/dist/pyodide-worker/worker.js` ≥ 1 (the .py is now inlined into the worker bundle).
- `pnpm -F @local/yt-dlp-wasm typecheck` → clean
- `pnpm -F @local/yt-dlp-wasm lint` → clean
- `pnpm -F @local/yt-dlp-wasm test` → Phase-1 + Task-1 tests pass

- [x] **Step 5: Commit**

```bash
git add packages/yt-dlp-wasm/src/pyodide-worker/worker.ts packages/yt-dlp-wasm/src/client/controller.ts packages/yt-dlp-wasm/src/index.ts
git commit -m "feat(yt-dlp-wasm): boot pyodide in-worker + controller load/pyEcho"
```

---

## Task 4: Capstone smoke — boot Pyodide + yt-dlp in the Next route

Proves the whole Phase-2 path in a real browser: Pyodide loads from the CDN, yt-dlp installs, and an ECHO routed **through Python** returns uppercased text.

**Files:**
- Create: `scripts/fetch-yt-dlp-wheel.mjs`
- Modify: `package.json` (root script)
- Modify: `.gitignore`
- Modify: `src/app/yt-dlp-test/page.tsx`

- [x] **Step 1: Wheel-fetch script** — `scripts/fetch-yt-dlp-wheel.mjs`

Downloads the latest pure-Python yt-dlp wheel into `public/yt-dlp-wheels/` (served same-origin so it loads under COEP).

```js
import { mkdir, writeFile } from "node:fs/promises";

const OUT_DIR = "public/yt-dlp-wheels";
const meta = await (await fetch("https://pypi.org/pypi/yt-dlp/json")).json();
const files = meta.urls ?? meta.releases?.[meta.info.version] ?? [];
const wheel = files.find(
  (f) => f.packagetype === "bdist_wheel" && f.filename.endsWith("py3-none-any.whl"),
);
if (!wheel) throw new Error("no py3-none-any wheel found for yt-dlp");
await mkdir(OUT_DIR, { recursive: true });
const bytes = new Uint8Array(await (await fetch(wheel.url)).arrayBuffer());
await writeFile(`${OUT_DIR}/${wheel.filename}`, bytes);
console.log(`wrote ${OUT_DIR}/${wheel.filename} (${bytes.length} bytes)`);
console.log(`version: ${meta.info.version}`);
```

- [x] **Step 2: Root script + gitignore**

In root `package.json` scripts, after `yt-dlp-wasm:public`, add:

```json
"yt-dlp-wasm:wheel": "node scripts/fetch-yt-dlp-wheel.mjs",
```

In `.gitignore`, under the existing yt-dlp-wasm asset ignore, add:

```
/public/yt-dlp-wheels
```

- [x] **Step 3: Extend the route** — `src/app/yt-dlp-test/page.tsx`

Add a second panel below the existing ECHO panel. Add this state + handler inside the component and render the panel (keep the Phase-1 ECHO panel as-is). The self-hosted wheel under `/yt-dlp-wheels/` requires its filename; the handler discovers it via a directory listing is not available, so the wheel filename is passed through a small manifest written by the script — simplest: have the script ALSO write `public/yt-dlp-wheels/manifest.json` with `{ "wheel": "<filename>", "version": "<v>" }`. Add to the script (Step 1), before the final logs:

```js
await writeFile(
  `${OUT_DIR}/manifest.json`,
  JSON.stringify({ wheel: wheel.filename, version: meta.info.version }),
);
```

Then the route handler:

```tsx
type BootState =
  | { kind: "idle" }
  | { kind: "booting" }
  | { kind: "ok"; version: string; echo: string; ms: number }
  | { kind: "error"; message: string };

// inside the component:
const [boot, setBoot] = useState<BootState>({ kind: "idle" });

async function bootAndTest() {
  setBoot({ kind: "booting" });
  try {
    if (!self.crossOriginIsolated) {
      throw new Error("Not cross-origin isolated (SharedArrayBuffer unavailable).");
    }
    const manifest = await (await fetch("/yt-dlp-wheels/manifest.json")).json();
    const wheelUrl = `${location.origin}/yt-dlp-wheels/${manifest.wheel}`;
    const { createYtDlp } = await loadYtDlp();
    const ytdlp = createYtDlp({ ytDlpSource: { url: wheelUrl } });
    const start = performance.now();
    const { ytDlpVersion } = await ytdlp.load();
    const echo = await ytdlp.pyEcho("hello world");
    const ms = performance.now() - start;
    ytdlp.terminate();
    setBoot({ kind: "ok", version: ytDlpVersion, echo, ms });
  } catch (err) {
    setBoot({ kind: "error", message: err instanceof Error ? err.message : String(err) });
  }
}
```

Render (add below the existing `<output>` block; note the `loadYtDlp` helper and `YtDlpModule` type from the Phase-1 route must expose the new methods — update the cast type to include `load`, `pyEcho`):

```tsx
<section className="mt-4 flex flex-col gap-2 border-neutral-500 border-t pt-4">
  <h2 className="font-semibold">Pyodide + yt-dlp</h2>
  <p className="text-neutral-500 text-xs dark:text-neutral-400">
    Boots Pyodide from the CDN, installs the self-hosted yt-dlp wheel, then runs
    an ECHO routed through Python. First boot downloads ~10 MB and takes a while.
  </p>
  <button
    type="button"
    onClick={bootAndTest}
    disabled={boot.kind === "booting"}
    className="self-start rounded bg-neutral-800 px-3 py-1.5 text-white disabled:opacity-50 dark:bg-neutral-200 dark:text-black"
  >
    {boot.kind === "booting" ? "Booting…" : "Boot Pyodide + yt-dlp"}
  </button>
  <output className="block min-h-6">
    {boot.kind === "ok" && (
      <span className="text-green-600 dark:text-green-400">
        ✓ yt-dlp {boot.version} · python echo {JSON.stringify(boot.echo)} (
        {(boot.ms / 1000).toFixed(1)}s)
      </span>
    )}
    {boot.kind === "error" && (
      <span className="text-red-600 dark:text-red-400">✗ {boot.message}</span>
    )}
  </output>
</section>
```

Update the `loadYtDlp` cast type in the route to include the new methods:

```ts
type YtDlpHandle = {
  load: () => Promise<{ ytDlpVersion: string }>;
  ping: (text: string) => Promise<string>;
  pyEcho: (text: string) => Promise<string>;
  terminate: () => void;
};
```

- [x] **Step 4: Publish assets + fetch the wheel**

Run: `pnpm yt-dlp-wasm:public`
Run: `pnpm yt-dlp-wasm:wheel`
Expected: `public/yt-dlp-wasm/index.js` exists; `public/yt-dlp-wheels/<...>.whl` + `manifest.json` exist.

- [x] **Step 5: Verify (lint + typecheck)**

Run: `pnpm exec biome check src/app/yt-dlp-test/page.tsx scripts/fetch-yt-dlp-wheel.mjs package.json` → clean (auto-fix with `biome check --write` if needed).
Run: `pnpm exec tsc --noEmit` → exit 0.

- [x] **Step 6: Browser smoke (the capstone gate)**

Start the dev server (`pnpm dev`), open `/yt-dlp-test`, click **Boot Pyodide + yt-dlp**, and confirm it shows `✓ yt-dlp <version> · python echo "HELLO WORLD"`. (Controller note: this is the de-risk gate proving Pyodide boot + yt-dlp install + the Python→SAB→services-worker round-trip under cross-origin isolation. Allow 20–60s on first run.)

If it shows a bytes error, apply the Task-2 marshalling fallback. If yt-dlp install fails on a missing dep, confirm `deps=False` is in effect for the URL source.

- [x] **Step 7: Commit**

```bash
git add scripts/fetch-yt-dlp-wheel.mjs package.json .gitignore src/app/yt-dlp-test/page.tsx
git commit -m "feat(yt-dlp-wasm): boot pyodide + yt-dlp from the /yt-dlp-test route"
```

---

## Self-Review (against the spec)

- **Pyodide loads from jsDelivr CDN** (spec "Assets load from jsDelivr CDN by default"): `resolvePyodideIndexURL` + runtime `pyodide.mjs` import. ✅
- **yt-dlp loaded via configurable source** (spec "Configurable source URL"): `ytDlpSource` = `"micropip"` (default) | `{ url }`. ✅
- **Synchronous bridge proven from Python** (spec constraint #3, sync-over-async): `bridge.py` → `ytdlp_bridge_js.call` → `SabRequester.call` (Atomics.wait); proven by the Task 4 `pyEcho` smoke. ✅
- **Custom RequestHandler / subprocess shim / ffmpeg**: NOT in Phase 2 — Phases 3–4. Correctly out of scope.
- **Placeholder scan:** none — every step has complete code; `PYODIDE_VERSION` has an explicit "set from Step 1" instruction (a value, not a placeholder).
- **Type consistency:** `PyodideBootConfig`, `YtDlpSource`, `resolvePyodideIndexURL`, `resolveYtDlpInstall`, `bootPyodide`, `PyodideRuntime`, controller `load`/`ping`/`pyEcho`/`ytDlpVersion`, worker messages (`ready`/`boot-error`/`pong`/`py-echo-result`) are used consistently across config.ts, boot.ts, worker.ts, controller.ts, and the route.
- **Coverage honesty:** only the pure config helpers are unit-tested (vitest). The Pyodide boot, marshalling, and Python→bridge path are proven by the manual browser smoke (Task 4) — Pyodide can't run cheaply in CI, same boundary as Phase 1's cross-thread proof.

## Notes for Phase 3+ (cheap to flag now)

- The `micropip`-from-PyPI default will need libcurl-over-Wisp (Phase 4) to fetch wheels under COEP, or self-hosted wheels (as the smoke does). Document whichever becomes the supported path.
- Phase 3 (ffmpeg) and Phase 4 (networking) will add real opcodes (`FFMPEG_EXEC`, `NET_SEND`, chunked `FS_READ`) and the streaming SAB protocol; the `ytdlp_bridge_js.call(op, payload)` seam already accommodates new ops.
- Carry over the deferred Phase-1 polish: wire the `Op` type into `SabRequester`/`SabResponder` signatures, and document the single-in-flight SAB invariant (now relevant since the controller issues `ping`/`pyEcho` round-trips).
