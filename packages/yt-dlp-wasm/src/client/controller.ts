import { createSab } from "../bridge/sab";
import type { PyodideBootConfig } from "../pyodide-worker/config";
import type { FfmpegConfig } from "../services-worker/config";
import { createResponder } from "../services-worker/responder";

export interface YtDlpConfig extends PyodideBootConfig, FfmpegConfig {
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
    terminate() {
      pyodideWorker.terminate();
    },
  };
}
