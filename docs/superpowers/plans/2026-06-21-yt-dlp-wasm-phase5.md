# yt-dlp-wasm — Phase 5 Implementation Plan (public API: exec, events, download)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Round out the faithful public API the spec described, on top of the proven bridge/Pyodide/networking foundation: a `progress`/`log` **event stream**, `exec(argv)` (the real yt-dlp CLI entrypoint, capturing stdout/stderr + exit code + output files), and a `download(url, opts)` convenience (yt-dlp's `YoutubeDL` with the WispRH networking + the ffmpeg shim, emitting live progress).

**Architecture:** Builds on Phases 1–4. No new SAB opcodes — `exec`/`download`/`read-output` are pyodide-worker message handlers (like `py-echo`), and live progress/log flow over a NEW worker→main **event channel** (`self.postMessage({type:"event", ...})` → controller `on(channel, cb)`), separate from the request/reply `once()` path. Output files land in Pyodide's MEMFS `/work` and are read out via a `read-output` handler. yt-dlp networking is forced through `WispRH`.

**Tech Stack:** Pyodide + yt-dlp (Phases 2–4), the WispRH networking (Phase 4), the ffmpeg subprocess shim (Phase 3). Vitest (controller event-emitter unit), Playwright MCP (capstone). Spec: `docs/superpowers/specs/2026-06-19-yt-dlp-wasm-design.md`. Prereq: Phases 1–4 usable.

**Verification boundary (be honest):**
- ✅ Verifiable here: the event stream (synthetic emit), `exec(["--version"])` (no network/ffmpeg → exit 0 + version), `readOutputFile` (write to `/work`, read back).
- ⏳ Deferred (same env blockers as Phases 3–4): full `download()` and real-URL `exec` need ffmpeg (blocked in this automation browser) + a self-hosted Wisp. Built and structurally sound; verify in a real browser with a real Wisp.

---

## Key risks
1. **`exec` exit semantics.** `yt_dlp.main(argv)` raises `SystemExit`. Capture the code via `except SystemExit`; redirect `sys.stdout`/`sys.stderr` to `StringIO` around the call. Verify with `--version`.
2. **Global handler for `exec`.** `yt_dlp.main` builds its own `YoutubeDL`, so per-instance `use_only_wisp` can't reach it. `network_handler.force_global()` prunes the global RH registry to only `WispRH`. The registry name/structure (`_REQUEST_HANDLERS` in `yt_dlp.networking.common`) must be verified against the installed wheel (the `--version` smoke doesn't exercise it; real-URL exec does — deferred).
3. **Live progress while the worker is busy.** Progress hooks fire synchronously inside yt-dlp; `_emit` → `self.postMessage` queues to the main thread immediately (the worker needn't be idle to post), so events stream in real time even between the Atomics-blocked network calls. Fine.
4. **Output-file size.** `read-output` returns bytes via a transferable `postMessage` (not the SAB) — simplest for now; large media is the deferred streaming concern (and blocked on ffmpeg anyway).

---

## File Structure (Phase 5)

| File | Responsibility | New/Changed |
| --- | --- | --- |
| `src/pyodide-worker/worker.ts` | Register `_emit`; `exec`/`download`/`read-output` handlers | changed |
| `src/pyodide-worker/py/api.py` | `run_exec(argv)` + `run_download(url, opts)` (logger+hooks→`_emit`) | new |
| `src/pyodide-worker/py/network_handler.py` | add `force_global()` | changed |
| `src/pyodide-worker/boot.ts` | write `api.py` to sys.path | changed |
| `src/client/controller.ts` | `on/off` event channel; `exec`/`download`/`readOutputFile` | changed |
| `src/client/events.ts` (+test) | tiny typed event emitter (unit-tested) | new |
| `src/app/yt-dlp-test/page.tsx` | "CLI / download" panel | changed |

---

## Task 1: Event emitter + exec(argv) + readOutputFile

**Files:**
- Create: `src/client/events.ts` + `events.test.ts`
- Modify: `src/pyodide-worker/worker.ts`, `src/client/controller.ts`

- [x] **Step 1: `src/client/events.ts` (+ failing test first)** — a tiny typed emitter (unit-testable, pure):

`events.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Emitter } from "./events";

describe("Emitter", () => {
  it("delivers to on() listeners and stops after off()", () => {
    const e = new Emitter<{ progress: number; log: string }>();
    const seen: number[] = [];
    const cb = (n: number) => seen.push(n);
    e.on("progress", cb);
    e.emit("progress", 1);
    e.off("progress", cb);
    e.emit("progress", 2);
    expect(seen).toEqual([1]);
  });

  it("isolates channels and tolerates a throwing listener", () => {
    const e = new Emitter<{ a: string; b: string }>();
    const got: string[] = [];
    e.on("a", () => { throw new Error("boom"); });
    e.on("a", (v) => got.push(`a:${v}`));
    e.on("b", (v) => got.push(`b:${v}`));
    e.emit("a", "x"); // throwing listener must not block the next one
    e.emit("b", "y");
    expect(got).toEqual(["a:x", "b:y"]);
  });
});
```

`events.ts`:
```ts
type Listener<T> = (data: T) => void;

/** Minimal typed multi-channel event emitter. */
export class Emitter<E extends Record<string, unknown>> {
  private readonly channels = new Map<keyof E, Set<Listener<unknown>>>();

  on<K extends keyof E>(channel: K, cb: Listener<E[K]>): void {
    let set = this.channels.get(channel);
    if (!set) {
      set = new Set();
      this.channels.set(channel, set);
    }
    set.add(cb as Listener<unknown>);
  }

  off<K extends keyof E>(channel: K, cb: Listener<E[K]>): void {
    this.channels.get(channel)?.delete(cb as Listener<unknown>);
  }

  emit<K extends keyof E>(channel: K, data: E[K]): void {
    for (const cb of this.channels.get(channel) ?? []) {
      try {
        (cb as Listener<E[K]>)(data);
      } catch {
        // a throwing listener must not break delivery to the others
      }
    }
  }
}
```

- [x] **Step 2: `src/pyodide-worker/worker.ts`** — register `_emit` once the runtime is ready, and add `exec` + `read-output` handlers.
  - When creating `runtime`, chain registration of the emit bridge:
```ts
    runtime = bootPyodide((msg.config ?? {}) as PyodideBootConfig, requester).then(
      (rt) => {
        rt.pyodide.globals.set(
          "_emit",
          (channel: string, data: string) =>
            self.postMessage({ type: "event", channel, data }),
        );
        return rt;
      },
    );
    runtime.then(
      (rt) => self.postMessage({ type: "ready", ytDlpVersion: rt.ytDlpVersion }),
      (err) => self.postMessage({ type: "boot-error", message: messageOf(err) }),
    );
```
  - Add message branches:
```ts
  } else if (msg?.type === "exec") {
    void handleExec(msg.argv as string[]);
  } else if (msg?.type === "read-output") {
    void handleReadOutput(msg.name as string);
  }
```
  - Handlers:
```ts
async function handleExec(argv: string[]): Promise<void> {
  try {
    if (!runtime) throw new Error("exec before init");
    const { pyodide } = await runtime;
    pyodide.globals.set("_argv", argv);
    const result = (await pyodide.runPythonAsync(`
import api
api.run_exec(list(_argv))
`)) as string;
    self.postMessage({ type: "exec-result", text: result });
  } catch (err) {
    self.postMessage({ type: "exec-result", error: messageOf(err) });
  }
}

async function handleReadOutput(name: string): Promise<void> {
  try {
    if (!runtime) throw new Error("read-output before init");
    const { pyodide } = await runtime;
    pyodide.globals.set("_out_name", name);
    const bytes = pyodide.runPython(
      `open("/work/" + _out_name, "rb").read()`,
    ) as Uint8Array;
    // bytes is a Python memoryview/bytes -> JS Uint8Array via Pyodide; copy + transfer
    const copy = bytes.slice();
    self.postMessage({ type: "read-output-result", name, bytes: copy }, [copy.buffer]);
  } catch (err) {
    self.postMessage({ type: "read-output-result", name, error: messageOf(err) });
  }
}
```
  (Note: `pyodide.runPython("open(...).read()")` returns Python `bytes`; Pyodide converts a returned `bytes` to a JS `Uint8Array` (or memoryview-backed) — `.slice()` makes a transferable copy. If the conversion yields a PyProxy, call `.toJs()`; the smoke confirms.)

- [x] **Step 3: `src/client/controller.ts`** — add the event channel + methods.
  - Import the `Emitter`. Define the event type and add an internal emitter; route `{type:"event"}` messages to it:
```ts
import { Emitter } from "./events";
export type YtDlpEvents = { progress: Record<string, unknown>; log: string };
```
  - In `createYtDlp`, after spawning the worker:
```ts
  const events = new Emitter<YtDlpEvents>();
  pyodideWorker.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "event") {
      const ch = e.data.channel as keyof YtDlpEvents;
      const parsed = ch === "log" ? (e.data.data as string) : JSON.parse(e.data.data as string);
      events.emit(ch, parsed as never);
    }
  });
```
  - Add to the `YtDlp` interface + returned object:
```ts
  on<K extends keyof YtDlpEvents>(channel: K, cb: (data: YtDlpEvents[K]) => void): void;
  off<K extends keyof YtDlpEvents>(channel: K, cb: (data: YtDlpEvents[K]) => void): void;
  exec(argv: string[]): Promise<{ exitCode: number; stdout: string; stderr: string; files: { name: string; size: number }[] }>;
  readOutputFile(name: string): Promise<Uint8Array>;
```
```ts
    on: (channel, cb) => events.on(channel, cb),
    off: (channel, cb) => events.off(channel, cb),
    exec: (argv) =>
      once("exec-result", () => pyodideWorker.postMessage({ type: "exec", argv }), (d) => JSON.parse(d.text as string)),
    readOutputFile: (name) =>
      new Promise<Uint8Array>((resolve, reject) => {
        const onMsg = (e: MessageEvent) => {
          if (e.data?.type === "read-output-result" && e.data.name === name) {
            pyodideWorker.removeEventListener("message", onMsg);
            if (e.data.error) reject(new Error(e.data.error));
            else resolve(e.data.bytes as Uint8Array);
          }
        };
        pyodideWorker.addEventListener("message", onMsg);
        pyodideWorker.postMessage({ type: "read-output", name });
      }),
```

- [x] **Step 4: `src/pyodide-worker/py/api.py`** (the `run_exec` half; `run_download` added in Task 2):
```python
"""Public API entrypoints run inside Pyodide."""

import io
import json
import os
import sys

_WORK = "/work"


def _ensure_work():
    os.makedirs(_WORK, exist_ok=True)


def _list_outputs():
    return [
        {"name": f, "size": os.path.getsize(os.path.join(_WORK, f))}
        for f in sorted(os.listdir(_WORK))
        if os.path.isfile(os.path.join(_WORK, f))
    ]


def run_exec(argv) -> str:
    """Run yt-dlp's real CLI entrypoint; capture stdout/stderr/exit code + /work files."""
    _ensure_work()
    import network_handler
    try:
        network_handler.force_global()
    except Exception:
        pass
    import yt_dlp

    out, err = io.StringIO(), io.StringIO()
    real_out, real_err = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = out, err
    code = 0
    cwd = os.getcwd()
    os.chdir(_WORK)
    try:
        yt_dlp.main(list(argv))
    except SystemExit as e:
        code = e.code if isinstance(e.code, int) else (0 if not e.code else 1)
    except Exception as e:  # noqa: BLE001
        code = 1
        err.write(str(e))
    finally:
        sys.stdout, sys.stderr = real_out, real_err
        os.chdir(cwd)
    return json.dumps(
        {"exitCode": code, "stdout": out.getvalue(), "stderr": err.getvalue(), "files": _list_outputs()},
    )
```
  - Add `force_global()` to `src/pyodide-worker/py/network_handler.py`:
```python
def force_global():
    """Prune yt-dlp's global request-handler registry to ONLY WispRH so that
    YoutubeDL instances built internally (e.g. by yt_dlp.main) use Wisp, not urllib."""
    from yt_dlp.networking.common import _REQUEST_HANDLERS

    for key in list(_REQUEST_HANDLERS):
        if _REQUEST_HANDLERS[key] is not WispRH:
            del _REQUEST_HANDLERS[key]
```
  (Verify `_REQUEST_HANDLERS` exists in the installed wheel's `yt_dlp/networking/common.py`; if the name differs, adjust. The `--version` smoke does not depend on this.)

- [x] **Step 5: `boot.ts`** — write `api.py` to `/tmp/ytdlp_py` (add `apiPy` import + a `pyodide.globals.set("_api_py", apiPy)` + include `("api", _api_py)` in the write-loop, after `network_handler`). Do NOT import it at boot (it imports yt_dlp lazily).

- [x] **Step 6: Gates** — `pnpm -F @local/yt-dlp-wasm test` (events.test.ts passes + prior 22 = 24+), typecheck/lint/build clean; `grep -c "run_exec" packages/yt-dlp-wasm/dist/pyodide-worker/worker.js` ≥ 1.

- [x] **Step 7: Commit**
```bash
git add packages/yt-dlp-wasm/src/client/events.ts packages/yt-dlp-wasm/src/client/events.test.ts packages/yt-dlp-wasm/src/pyodide-worker/worker.ts packages/yt-dlp-wasm/src/client/controller.ts packages/yt-dlp-wasm/src/pyodide-worker/py/api.py packages/yt-dlp-wasm/src/pyodide-worker/py/network_handler.py packages/yt-dlp-wasm/src/pyodide-worker/boot.ts
git commit -m "feat(yt-dlp-wasm): event stream + exec(argv) + readOutputFile"
```

---

## Task 2: download(url, opts) with live progress/log

**Files:**
- Modify: `src/pyodide-worker/py/api.py` (add `run_download`)
- Modify: `src/pyodide-worker/worker.ts` (add `download` handler)
- Modify: `src/client/controller.ts` (add `download`)

- [x] **Step 1: `api.py` — `run_download`** (emits live `progress`/`log` via the `_emit` global registered in the worker; uses the per-instance `use_only_wisp` — the verified Phase-4 path):
```python
def run_download(url: str, opts_json: str) -> str:
    _ensure_work()
    import yt_dlp
    import network_handler

    user_opts = json.loads(opts_json) if opts_json else {}

    def _emit_safe(channel, payload):
        try:
            _emit(channel, payload)  # noqa: F821 (injected JS global)
        except Exception:
            pass

    class _Logger:
        def debug(self, m):
            if not str(m).startswith("[debug]"):
                _emit_safe("log", str(m))
        def info(self, m):
            _emit_safe("log", str(m))
        def warning(self, m):
            _emit_safe("log", "WARNING: " + str(m))
        def error(self, m):
            _emit_safe("log", "ERROR: " + str(m))

    def _hook(d):
        keys = ("status", "downloaded_bytes", "total_bytes", "total_bytes_estimate", "eta", "speed", "filename")
        _emit_safe("progress", json.dumps({k: d.get(k) for k in keys}))

    opts = {
        "paths": {"home": _WORK},
        "outtmpl": "%(title)s.%(ext)s",
        "logger": _Logger(),
        "progress_hooks": [_hook],
        "noplaylist": True,
        **user_opts,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        network_handler.use_only_wisp(ydl)
        ydl.download([url])
    return json.dumps({"files": _list_outputs()})
```

- [x] **Step 2: `worker.ts` — `download` handler** (sibling to `exec`):
```ts
  } else if (msg?.type === "download") {
    void handleDownload(msg.url as string, msg.opts as string);
  }
```
```ts
async function handleDownload(url: string, opts: string): Promise<void> {
  try {
    if (!runtime) throw new Error("download before init");
    const { pyodide } = await runtime;
    pyodide.globals.set("_dl_url", url);
    pyodide.globals.set("_dl_opts", opts ?? "");
    const result = (await pyodide.runPythonAsync(`
import api
api.run_download(_dl_url, _dl_opts)
`)) as string;
    self.postMessage({ type: "download-result", text: result });
  } catch (err) {
    self.postMessage({ type: "download-result", error: messageOf(err) });
  }
}
```

- [x] **Step 3: `controller.ts` — `download`** (interface + returned object):
```ts
  download(url: string, opts?: Record<string, unknown>): Promise<{ files: { name: string; size: number }[] }>;
```
```ts
    download: (url, opts) =>
      once("download-result", () => pyodideWorker.postMessage({ type: "download", url, opts: JSON.stringify(opts ?? {}) }), (d) => JSON.parse(d.text as string)),
```

- [x] **Step 4: Gates** — typecheck/lint/build/test green; `grep -c "run_download" dist/pyodide-worker/worker.js` ≥ 1.

- [x] **Step 5: Commit**
```bash
git add packages/yt-dlp-wasm/src/pyodide-worker/py/api.py packages/yt-dlp-wasm/src/pyodide-worker/worker.ts packages/yt-dlp-wasm/src/client/controller.ts
git commit -m "feat(yt-dlp-wasm): download(url, opts) with live progress/log events"
```

---

## Task 3: Route panel + capstone smoke

**Files:** Modify `src/app/yt-dlp-test/page.tsx`.

- [x] **Step 1: Update the `YtDlpHandle` cast type** in `loadYtDlp` to add `on`/`off`/`exec`/`readOutputFile`/`download`.

- [x] **Step 2: Add a "CLI & events" panel** with:
  - A **`yt-dlp --version`** button: `createYtDlp({ wispUrl: "wss://wisp.mercurywork.shop/", ytDlpSource: { url: wheelUrl } })`, `await load()`, `const r = await ytdlp.exec(["--version"])`; render `✓ exit {r.exitCode} · {r.stdout.trim()}`.
  - An **events** demo: register `ytdlp.on("log", l => append(l))` before a call so the live log shows (e.g. during `exec(["--version", "--verbose"])` or the download attempt). Render the last few log lines.
  - An **output-file** check: a button that runs `await ytdlp.exec(["--version"])` is fileless; instead verify `readOutputFile` via a tiny op — call `ytdlp.exec(["--help"])`? still fileless. So add a dedicated check: after `load()`, write a file through a one-off — simplest is to expose it through `download` (env-gated). For a self-contained output-file proof, the controller can run `exec(["--version"])` (no file) AND separately the smoke (Task 3 Step 4) writes `/work/probe.txt` via a raw `pyEcho`-style path. KEEP the panel simple: a **Download** input + button (`ytdlp.download(url)`), clearly labeled "needs ffmpeg + a real Wisp" — it will stream `progress`/`log` events into the log display even if it ultimately can't finish here.

- [x] **Step 3: Publish + static checks** — `pnpm yt-dlp-wasm:public`; biome + root `tsc --noEmit` clean; package test (24+) pass.

- [x] **Step 4: Browser smoke (the gate — controller-driven)** — `pnpm dev`, `/yt-dlp-test`:
  - **exec:** click **yt-dlp --version** → expect `✓ exit 0 · 2026.06.09` (proves the real CLI entrypoint + stdout/exit capture, no network/ffmpeg).
  - **events:** confirm log lines appear in the events display during a call (proves the worker→controller event channel).
  - **readOutputFile:** drive via the controller — `pyodide` writes `/work/probe.txt` (run `exec(["--version"])` won't; instead evaluate in the page: call a sequence that writes then `readOutputFile("probe.txt")`). Concretely, the controller smoke does: `await ytdlp.load(); /* worker writes a probe via exec or a dedicated path */`. If no clean fileless write exists, assert `readOutputFile` against a file created by a successful `download` only when the env allows — otherwise note readOutputFile as covered by code + the events/exec gates. (Don't fake it.)
  - **download:** attempt with an easy URL; expect live `progress`/`log` events; the final result is env-gated (ffmpeg/Wisp) — record whatever happens honestly.

- [x] **Step 5: Commit**
```bash
git add src/app/yt-dlp-test/page.tsx
git commit -m "feat(yt-dlp-wasm): CLI/events/download panel on the /yt-dlp-test route"
```

---

## Self-Review (against the spec)
- **`exec(argv)` = real CLI entrypoint** (spec "Public API"): `api.run_exec` → `yt_dlp.main(argv)` with stdout/stderr/exit capture + `/work` outputs. ✅ (verifiable via `--version`)
- **`progress`/`log` events** (spec): worker `_emit` → `{type:"event"}` → controller `Emitter` → `on/off`. ✅ (verifiable synthetically / via `--verbose`)
- **`download(url, opts)` convenience** (spec): `api.run_download` → `YoutubeDL` + `use_only_wisp` + hooks/logger → `/work` files. ✅ built (e2e deferred: ffmpeg + real Wisp)
- **Output files from MEMFS `/work`** (spec): `readOutputFile` + the handlers' `_list_outputs`. ✅
- **`extractInfo`** already shipped (Phase 4); the API surface is now `load/extractInfo/download/exec/readOutputFile/on/off/ping/...`.
- **Honest coverage:** `events.ts` unit-tested; `exec --version`, event stream, readOutputFile verifiable; full `download`/real-URL `exec` deferred to a real browser + self-hosted Wisp (documented).
- **Placeholders:** none; the `force_global` registry name + the `readOutputFile` bytes-conversion are flagged with concrete verify steps.

## Notes for later
- Streaming output files (vs. one transferable `postMessage`) for large media — pairs with the ffmpeg + streaming-network deferrals.
- `force_global()` registry-pruning is global mutation; the per-instance `use_only_wisp` (used by `download`/`extractInfo`) is cleaner — prefer it where the ydl is owned.
- Opcode/registry duplication and self-hosted Wisp remain the standing cross-phase follow-ups.
