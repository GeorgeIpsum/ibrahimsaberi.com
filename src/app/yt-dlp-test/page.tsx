"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";

type YtDlpHandle = {
  load: () => Promise<{ ytDlpVersion: string }>;
  ping: (text: string) => Promise<string>;
  pyEcho: (text: string) => Promise<string>;
  ffmpegSelfTest: (
    wavBase64: string,
  ) => Promise<{ code: number; outSize: number; probe: string }>;
  netFetch: (
    url: string,
  ) => Promise<{ status: number; size: number; preview: string }>;
  extractInfo: (
    url: string,
    opts?: Record<string, unknown>,
  ) => Promise<{
    title: string | null;
    ext: string | null;
    id: string | null;
    extractor: string | null;
    formatCount: number;
  }>;
  exec: (argv: string[]) => Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
    files: { name: string; size: number }[];
  }>;
  download: (
    url: string,
    opts?: Record<string, unknown>,
  ) => Promise<{ files: { name: string; size: number }[] }>;
  readOutputFile: (name: string) => Promise<Uint8Array>;
  on: (channel: "log" | "progress", cb: (data: unknown) => void) => void;
  off: (channel: "log" | "progress", cb: (data: unknown) => void) => void;
  terminate: () => void;
};

type YtDlpModule = {
  createYtDlp: (config?: {
    dataCapacity?: number;
    ytDlpSource?: "micropip" | { url: string };
    wispUrl?: string;
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

function makeSilentWavBase64(): string {
  const sampleRate = 8000;
  const seconds = 0.2;
  const n = Math.floor(sampleRate * seconds);
  const buf = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buf);
  const wr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  wr(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  wr(8, "WAVE");
  wr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  wr(36, "data");
  view.setUint32(40, n * 2, true);
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
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

type NetState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; result: string; ms: number }
  | { kind: "error"; message: string };

type ExecState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; exitCode: number; version: string }
  | { kind: "error"; message: string };

type DlState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; files: { name: string; size: number }[] }
  | { kind: "error"; message: string };

export default function YtDlpTestPage() {
  const [text, setText] = useState("hello world");
  const [state, setState] = useState<RunState>({ kind: "idle" });
  const [boot, setBoot] = useState<BootState>({ kind: "idle" });
  const [ff, setFf] = useState<
    | { kind: "idle" }
    | { kind: "running" }
    | { kind: "ok"; outSize: number; probe: string; ms: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [netUrl, setNetUrl] = useState("https://example.com/");
  const [netState, setNetState] = useState<NetState>({ kind: "idle" });
  const [exec, setExec] = useState<ExecState>({ kind: "idle" });
  const [dl, setDl] = useState<DlState>({ kind: "idle" });
  const [logs, setLogs] = useState<string[]>([]);
  const [dlUrl, setDlUrl] = useState(
    "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm",
  );
  const [cookiesTxt, setCookiesTxt] = useState<string | null>(null);

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

  async function ffmpegTest() {
    setFf({ kind: "running" });
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
      await ytdlp.load();
      const r = await ytdlp.ffmpegSelfTest(makeSilentWavBase64());
      const ms = performance.now() - start;
      ytdlp.terminate();
      if (r.outSize > 0)
        setFf({ kind: "ok", outSize: r.outSize, probe: r.probe, ms });
      else
        setFf({
          kind: "error",
          message: `ffmpeg produced no output (code ${r.code})`,
        });
    } catch (err) {
      setFf({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function netFetchTest() {
    setNetState({ kind: "running" });
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
      const ytdlp = createYtDlp({
        wispUrl: "wss://wisp.mercurywork.shop/",
        ytDlpSource: { url: wheelUrl },
      });
      const start = performance.now();
      await ytdlp.load();
      const r = await ytdlp.netFetch(netUrl);
      const ms = performance.now() - start;
      ytdlp.terminate();
      setNetState({
        kind: "ok",
        result: `${r.status} · ${r.size} bytes\n${r.preview}`,
        ms,
      });
    } catch (err) {
      setNetState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function extractInfoTest() {
    setNetState({ kind: "running" });
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
      const ytdlp = createYtDlp({
        wispUrl: "wss://wisp.mercurywork.shop/",
        ytDlpSource: { url: wheelUrl },
      });
      const start = performance.now();
      await ytdlp.load();
      const opts: Record<string, unknown> = {
        extractor_args: { youtube: { player_client: ["android"] } },
      };
      if (cookiesTxt) opts.cookiesTxt = cookiesTxt;
      const info = await ytdlp.extractInfo(netUrl, opts);
      const ms = performance.now() - start;
      ytdlp.terminate();
      setNetState({
        kind: "ok",
        result: `${info.title} [${info.extractor}] id=${info.id} ext=${info.ext} · ${info.formatCount} formats`,
        ms,
      });
    } catch (err) {
      setNetState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function runVersion() {
    setExec({ kind: "running" });
    try {
      if (!self.crossOriginIsolated)
        throw new Error("not cross-origin isolated");
      const manifest = await (
        await fetch("/yt-dlp-wheels/manifest.json")
      ).json();
      const wheelUrl = `${location.origin}/yt-dlp-wheels/${manifest.wheel}`;
      const { createYtDlp } = await loadYtDlp();
      const ytdlp = createYtDlp({
        wispUrl: "wss://wisp.mercurywork.shop/",
        ytDlpSource: { url: wheelUrl },
      });
      await ytdlp.load();
      const r = await ytdlp.exec(["--version"]);
      ytdlp.terminate();
      setExec({ kind: "ok", exitCode: r.exitCode, version: r.stdout.trim() });
    } catch (err) {
      setExec({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function runDownload() {
    setDl({ kind: "running" });
    setLogs([]);
    try {
      if (!self.crossOriginIsolated)
        throw new Error("not cross-origin isolated");
      const manifest = await (
        await fetch("/yt-dlp-wheels/manifest.json")
      ).json();
      const wheelUrl = `${location.origin}/yt-dlp-wheels/${manifest.wheel}`;
      const { createYtDlp } = await loadYtDlp();
      const ytdlp = createYtDlp({
        wispUrl: "wss://wisp.mercurywork.shop/",
        ytDlpSource: { url: wheelUrl },
      });
      const onLog = (l: unknown) =>
        setLogs((prev) => [...prev.slice(-40), String(l)]);
      const onProg = (p: unknown) =>
        setLogs((prev) => [
          ...prev.slice(-40),
          `progress ${JSON.stringify(p)}`,
        ]);
      ytdlp.on("log", onLog);
      ytdlp.on("progress", onProg);
      await ytdlp.load();
      const r = await ytdlp.download(
        dlUrl,
        cookiesTxt ? { cookiesTxt } : undefined,
      );
      ytdlp.off("log", onLog);
      ytdlp.off("progress", onProg);
      ytdlp.terminate();
      setDl({ kind: "ok", files: r.files });
    } catch (err) {
      setDl({
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
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      </label>

      <Button
        className="self-start"
        loading={state.kind === "running"}
        onClick={run}
      >
        Run ECHO round-trip
      </Button>

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
        <Button
          className="self-start"
          loading={boot.kind === "booting"}
          onClick={bootAndTest}
        >
          Boot Pyodide + yt-dlp
        </Button>
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

      <section className="mt-4 flex flex-col gap-2 border-neutral-500 border-t pt-4">
        <h2 className="font-semibold">ffmpeg self-test (WAV → MP3)</h2>
        <p className="text-neutral-500 text-xs dark:text-neutral-400">
          Synthesizes a tiny silent WAV in-browser and transcodes it to MP3 via
          the ffmpeg.wasm bridge, then probes the output with ffprobe_compat.
        </p>
        <Button
          className="self-start"
          loading={ff.kind === "running"}
          onClick={ffmpegTest}
        >
          Run ffmpeg self-test
        </Button>
        <output className="block min-h-6">
          {ff.kind === "ok" && (
            <span className="text-green-600 dark:text-green-400">
              ✓ out.mp3 {ff.outSize} bytes · probe {ff.probe} (
              {(ff.ms / 1000).toFixed(1)}s)
            </span>
          )}
          {ff.kind === "error" && (
            <span className="text-red-600 dark:text-red-400">
              ✗ {ff.message}
            </span>
          )}
        </output>
      </section>

      <section className="mt-4 flex flex-col gap-2 border-neutral-500 border-t pt-4">
        <h2 className="font-semibold">Networking (Wisp)</h2>
        <p className="text-neutral-500 text-xs dark:text-neutral-400">
          Tests the Wisp/libcurl network handler from Python. &ldquo;Fetch via
          Wisp&rdquo; sends a raw GET request; &ldquo;Extract info&rdquo; runs
          yt-dlp metadata extraction through the same handler.
        </p>
        <label className="flex flex-col gap-1">
          <span>URL</span>
          <Input value={netUrl} onChange={(e) => setNetUrl(e.target.value)} />
        </label>
        <label className="text-neutral-500 text-xs dark:text-neutral-400">
          Optional YouTube cookies.txt (stays in your browser):{" "}
          <Input
            nativeInput
            type="file"
            accept=".txt"
            className="mt-1"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              setCookiesTxt(f ? await f.text() : null);
            }}
          />
        </label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            loading={netState.kind === "running"}
            onClick={netFetchTest}
          >
            Fetch via Wisp
          </Button>
          <Button
            loading={netState.kind === "running"}
            onClick={extractInfoTest}
          >
            Extract info
          </Button>
        </div>
        <output className="block min-h-6">
          {netState.kind === "ok" && (
            <span className="text-green-600 dark:text-green-400">
              ✓ {netState.result} ({(netState.ms / 1000).toFixed(1)}s)
            </span>
          )}
          {netState.kind === "error" && (
            <span className="text-red-600 dark:text-red-400">
              ✗ {netState.message}
            </span>
          )}
        </output>
      </section>

      <section className="mt-4 flex flex-col gap-2 border-neutral-500 border-t pt-4">
        <h2 className="font-semibold">CLI &amp; events</h2>
        <p className="text-neutral-500 text-xs dark:text-neutral-400">
          Runs <code>yt-dlp --version</code> via <code>exec</code>, then
          exercises the <code>log</code> and <code>progress</code> event
          channels with a real download. The log stream proves the event bridge
          even if the download ultimately errors.
        </p>

        <Button
          className="self-start"
          loading={exec.kind === "running"}
          onClick={runVersion}
        >
          yt-dlp --version
        </Button>
        <output className="block min-h-6">
          {exec.kind === "ok" && (
            <span className="text-green-600 dark:text-green-400">
              ✓ exit {exec.exitCode} · yt-dlp {exec.version}
            </span>
          )}
          {exec.kind === "error" && (
            <span className="text-red-600 dark:text-red-400">
              ✗ {exec.message}
            </span>
          )}
        </output>

        <label className="flex flex-col gap-1">
          <span>Download URL</span>
          <Input value={dlUrl} onChange={(e) => setDlUrl(e.target.value)} />
        </label>
        <Button
          className="self-start"
          loading={dl.kind === "running"}
          onClick={runDownload}
        >
          Download (streams events)
        </Button>
        {logs.length > 0 && (
          <pre className="max-h-48 overflow-y-auto rounded border border-neutral-500 bg-neutral-900 p-2 text-neutral-200 text-xs dark:bg-neutral-950">
            {logs.join("\n")}
          </pre>
        )}
        <output className="block min-h-6">
          {dl.kind === "ok" && (
            <span className="text-green-600 dark:text-green-400">
              ✓ files: {dl.files.map((f) => f.name).join(", ")}
            </span>
          )}
          {dl.kind === "error" && (
            <span className="text-red-600 dark:text-red-400">
              ✗ {dl.message}
            </span>
          )}
        </output>
      </section>
    </main>
  );
}
