import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import type { DecodedFrame } from "../bridge/frame";
import { encodeFrame } from "../bridge/frame";
import { type FfmpegConfig, resolveFfmpegCore } from "./config";
import type { FileStore } from "./file-store";

let instance: FFmpeg | undefined;

// Resolve the sibling self-contained worker bundle (dist/ffmpeg-worker.js).
// The indirection through a variable keeps esbuild from treating this as a
// bundled asset reference; at runtime import.meta.url is the served index.js,
// so this resolves to a same-origin URL.
const FFMPEG_WORKER_FILE = "./ffmpeg-worker.js";

async function ensureFfmpeg(config: FfmpegConfig): Promise<FFmpeg> {
  if (instance) return instance;
  const { coreURL, wasmURL } = resolveFfmpegCore(config);
  // The core + wasm are self-contained, so toBlobURL is safe (and bypasses CORS
  // for the cross-origin CDN). The class worker is NOT blob'd: a blob-URL module
  // can't resolve the published worker's relative imports, which hangs
  // ff.load() forever. We serve a bundled, same-origin worker instead (a
  // consumer may override with their own same-origin worker URL).
  const classWorkerURL =
    config.ffmpegClassWorkerURL ??
    new URL(FFMPEG_WORKER_FILE, import.meta.url).href;
  const ff = new FFmpeg();
  await ff.load({
    coreURL: await toBlobURL(coreURL, "text/javascript"),
    wasmURL: await toBlobURL(wasmURL, "application/wasm"),
    classWorkerURL,
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
  } catch (err) {
    code = 1;
    stderr += err instanceof Error ? err.message : String(err);
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
