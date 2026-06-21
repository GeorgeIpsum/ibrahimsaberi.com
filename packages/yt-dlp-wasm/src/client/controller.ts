import { createSab } from "../bridge/sab";
import type { PyodideBootConfig } from "../pyodide-worker/config";
import type { FfmpegConfig, NetConfig } from "../services-worker/config";
import { createResponder } from "../services-worker/responder";
import { Emitter } from "./events";

export type YtDlpEvents = { progress: Record<string, unknown>; log: string };

export interface YtDlpConfig
  extends PyodideBootConfig,
    FfmpegConfig,
    NetConfig {
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
  /** ECHO round-trip routed THROUGH Python (proves the Python->bridge path). */
  pyEcho(text: string): Promise<string>;
  /** Self-test: transcode a base64 WAV to MP3 through the ffmpeg bridge. */
  ffmpegSelfTest(
    wavBase64: string,
  ): Promise<{ code: number; outSize: number; probe: string }>;
  /** Fetch a URL via the Wisp/libcurl network handler from Python. */
  netFetch(
    url: string,
  ): Promise<{ status: number; size: number; preview: string }>;
  /** Extract video metadata via yt-dlp using the Wisp network handler. */
  extractInfo(url: string): Promise<{
    title: string | null;
    ext: string | null;
    id: string | null;
    extractor: string | null;
  }>;
  on<K extends keyof YtDlpEvents>(
    channel: K,
    cb: (data: YtDlpEvents[K]) => void,
  ): void;
  off<K extends keyof YtDlpEvents>(
    channel: K,
    cb: (data: YtDlpEvents[K]) => void,
  ): void;
  exec(argv: string[]): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
    files: { name: string; size: number }[];
  }>;
  readOutputFile(name: string): Promise<Uint8Array>;
  terminate(): void;
}

function spawnPyodideWorker(): Worker {
  // Computed segment keeps the bundler from statically resolving/rewriting the
  // URL; it resolves at runtime to dist/pyodide-worker/worker.js.
  const name = "pyodide-worker";
  const url = new URL(`./${name}/worker.js`, import.meta.url);
  return new Worker(url, { type: "module" });
}

export function createYtDlp(config: YtDlpConfig = {}): YtDlp {
  const { dataCapacity, ...rest } = config;
  const sab = createSab(dataCapacity ?? 16 * 1024 * 1024);

  const pyodideWorker = spawnPyodideWorker();

  // The SAB responder runs on the MAIN THREAD: it never blocks (only the
  // Pyodide requester parks on Atomics.wait), so ffmpeg.wasm runs here, where
  // it's reliable, instead of nested inside a worker. The Pyodide worker posts
  // a "wake" message per bridge call; we run the responder in reply.
  const responder = createResponder(sab, rest);
  pyodideWorker.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "wake") void responder.handle();
  });

  const events = new Emitter<YtDlpEvents>();
  pyodideWorker.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "event") {
      const ch = e.data.channel as keyof YtDlpEvents;
      const parsed =
        ch === "log"
          ? (e.data.data as string)
          : JSON.parse(e.data.data as string);
      events.emit(ch, parsed as never);
    }
  });

  // Attach the readiness listener BEFORE posting init so `ready` can't race us.
  let resolveReady: (v: { ytDlpVersion: string }) => void;
  let rejectReady: (e: Error) => void;
  const ready = new Promise<{ ytDlpVersion: string }>((res, rej) => {
    resolveReady = res;
    rejectReady = rej;
  });
  pyodideWorker.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "ready")
      resolveReady({ ytDlpVersion: e.data.ytDlpVersion });
    else if (e.data?.type === "boot-error")
      rejectReady(new Error(e.data.message));
  });
  // Keep an observer on `ready` so a boot failure never becomes an unhandled
  // rejection if the caller creates an instance but never awaits load().
  void ready.catch(() => {});

  pyodideWorker.postMessage({ type: "init", sab, config: rest });

  // NOTE: single-in-flight only. Concurrent calls awaiting the same reply type
  // would both resolve to the first reply received; add a request id / queue
  // before exposing concurrent use. (Phase 1 review tracked this invariant.)
  function once<T>(
    type: string,
    post: () => void,
    pick: (data: Record<string, unknown>) => T,
  ): Promise<T> {
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
        (d) => d.text as string,
      ),
    pyEcho: (text) =>
      once<string>(
        "py-echo-result",
        () => pyodideWorker.postMessage({ type: "py-echo", text }),
        (d) => d.text as string,
      ),
    ffmpegSelfTest: (wavBase64) =>
      once(
        "ffmpeg-self-test-result",
        () =>
          pyodideWorker.postMessage({ type: "ffmpeg-self-test", wavBase64 }),
        (d) => JSON.parse(d.text as string),
      ),
    netFetch: (url) =>
      once(
        "net-fetch-result",
        () => pyodideWorker.postMessage({ type: "net-fetch", url }),
        (d) => JSON.parse(d.text as string),
      ),
    extractInfo: (url) =>
      once(
        "extract-info-result",
        () => pyodideWorker.postMessage({ type: "extract-info", url }),
        (d) => JSON.parse(d.text as string),
      ),
    on: (channel, cb) => events.on(channel, cb),
    off: (channel, cb) => events.off(channel, cb),
    exec: (argv) =>
      once(
        "exec-result",
        () => pyodideWorker.postMessage({ type: "exec", argv }),
        (d) => JSON.parse(d.text as string),
      ),
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
    terminate() {
      pyodideWorker.terminate();
    },
  };
}
