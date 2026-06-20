"use client";

import { useState } from "react";

type YtDlpHandle = {
  load: () => Promise<{ ytDlpVersion: string }>;
  ping: (text: string) => Promise<string>;
  pyEcho: (text: string) => Promise<string>;
  terminate: () => void;
};

type YtDlpModule = {
  createYtDlp: (config?: {
    dataCapacity?: number;
    ytDlpSource?: "micropip" | { url: string };
  }) => YtDlpHandle;
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

type BootState =
  | { kind: "idle" }
  | { kind: "booting" }
  | { kind: "ok"; version: string; echo: string; ms: number }
  | { kind: "error"; message: string };

export default function YtDlpTestPage() {
  const [text, setText] = useState("hello world");
  const [state, setState] = useState<RunState>({ kind: "idle" });
  const [boot, setBoot] = useState<BootState>({ kind: "idle" });

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

  async function bootAndTest() {
    setBoot({ kind: "booting" });
    try {
      if (!self.crossOriginIsolated) {
        throw new Error(
          "Not cross-origin isolated (SharedArrayBuffer unavailable).",
        );
      }
      const manifest = await (
        await fetch("/yt-dlp-wheels/manifest.json")
      ).json();
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
      setBoot({
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

      <section className="mt-4 flex flex-col gap-2 border-neutral-500 border-t pt-4">
        <h2 className="font-semibold">Pyodide + yt-dlp</h2>
        <p className="text-neutral-500 text-xs dark:text-neutral-400">
          Boots Pyodide from the CDN, installs the self-hosted yt-dlp wheel,
          then runs an ECHO routed through Python. First boot downloads ~10 MB
          and takes a while.
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
              ✓ yt-dlp {boot.version} · python echo {JSON.stringify(boot.echo)}{" "}
              ({(boot.ms / 1000).toFixed(1)}s)
            </span>
          )}
          {boot.kind === "error" && (
            <span className="text-red-600 dark:text-red-400">
              ✗ {boot.message}
            </span>
          )}
        </output>
      </section>
    </main>
  );
}
