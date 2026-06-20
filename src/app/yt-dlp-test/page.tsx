"use client";

import { useState } from "react";

type YtDlpHandle = {
  ping: (text: string) => Promise<string>;
  terminate: () => void;
};

type YtDlpModule = {
  createYtDlp: (config?: { dataCapacity?: number }) => YtDlpHandle;
};

// Loaded at runtime from /public/yt-dlp-wasm (publish with `pnpm yt-dlp-wasm:public`).
// A variable specifier + bundler-ignore comments keep Turbopack/webpack from
// trying to resolve or bundle the prebuilt ESM — its worker URLs must resolve
// relative to that public path at runtime, not be rewritten by the bundler.
async function loadYtDlp(): Promise<YtDlpModule> {
  const specifier = "/yt-dlp-wasm/index.js";
  return (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ specifier
  )) as YtDlpModule;
}

type RunState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; result: string; ms: number }
  | { kind: "error"; message: string };

export default function YtDlpTestPage() {
  const [text, setText] = useState("hello world");
  const [state, setState] = useState<RunState>({ kind: "idle" });

  async function run() {
    setState({ kind: "running" });
    try {
      if (!self.crossOriginIsolated) {
        throw new Error(
          "Page is not cross-origin isolated, so SharedArrayBuffer is unavailable. Check the COOP/COEP headers for /yt-dlp-test.",
        );
      }
      const { createYtDlp } = await loadYtDlp();
      const ytdlp = createYtDlp({ dataCapacity: 1024 });
      const start = performance.now();
      const result = await ytdlp.ping(text);
      const ms = performance.now() - start;
      ytdlp.terminate();
      setState({ kind: "ok", result, ms });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-8 font-mono text-sm">
      <h1 className="font-semibold text-lg">
        @local/yt-dlp-wasm — sync bridge test
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">
        Phase 1 smoke. Sends text through the SharedArrayBuffer + Atomics bridge
        across two Web Workers and gets it back uppercased (the ECHO op) —
        proving the synchronous-over-asynchronous bridge works inside the Next
        app under cross-origin isolation.
      </p>

      <label className="flex flex-col gap-1">
        <span>Input</span>
        <input
          className="rounded border border-neutral-500 bg-transparent px-2 py-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <button
        type="button"
        onClick={run}
        disabled={state.kind === "running"}
        className="self-start rounded bg-neutral-800 px-3 py-1.5 text-white disabled:opacity-50 dark:bg-neutral-200 dark:text-black"
      >
        {state.kind === "running" ? "Running…" : "Run ECHO round-trip"}
      </button>

      <output aria-live="polite" className="block min-h-6">
        {state.kind === "ok" && (
          <span className="text-green-600 dark:text-green-400">
            ✓ {JSON.stringify(state.result)} ({state.ms.toFixed(1)} ms)
          </span>
        )}
        {state.kind === "error" && (
          <span className="text-red-600 dark:text-red-400">
            ✗ {state.message}
          </span>
        )}
      </output>

      <p className="text-neutral-500 text-xs dark:text-neutral-400">
        On a 404 / load error, run <code>pnpm yt-dlp-wasm:public</code> to build
        and publish the package assets, then reload.
      </p>
    </main>
  );
}
