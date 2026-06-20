import { decodeFrame, encodeFrame } from "../bridge/frame";
import { SabResponder } from "../bridge/sab";
import { OP } from "../client/protocol";
import type { FfmpegConfig } from "./config";
import { type FfmpegExecMeta, runFfmpeg } from "./ffmpeg";
import { FileStore } from "./file-store";

/**
 * Build the SAB responder. Despite the `services-worker/` directory name, this
 * runs on the MAIN THREAD: the responder never blocks (only the Pyodide
 * requester parks on Atomics.wait), so ffmpeg.wasm can load here, where nested
 * workers aren't a problem. Each bridge call arrives as a "wake" message;
 * `responder.handle()` reads the request, does the work, writes the response,
 * and Atomics.notify-s the parked Pyodide worker.
 */
export function createResponder(
  sab: SharedArrayBuffer,
  ffmpegConfig: FfmpegConfig = {},
): SabResponder {
  const store = new FileStore();

  async function handle(op: number, payload: Uint8Array): Promise<Uint8Array> {
    switch (op) {
      case OP.ECHO:
        return Uint8Array.from(payload, (b) =>
          b >= 97 && b <= 122 ? b - 32 : b,
        );
      case OP.FS_PUT: {
        const { meta, body } = decodeFrame<{ name: string; offset: number }>(
          payload,
        );
        store.put(meta.name, meta.offset, body);
        return encodeFrame({ ok: true });
      }
      case OP.FS_STAT: {
        const { meta } = decodeFrame<{ name: string }>(payload);
        return encodeFrame({ size: store.stat(meta.name) });
      }
      case OP.FS_GET: {
        const { meta } = decodeFrame<{
          name: string;
          offset: number;
          len: number;
        }>(payload);
        const { body, eof } = store.get(meta.name, meta.offset, meta.len);
        return encodeFrame({ eof }, body);
      }
      case OP.FS_DELETE: {
        const { meta } = decodeFrame<{ name: string }>(payload);
        store.delete(meta.name);
        return encodeFrame({ ok: true });
      }
      case OP.FFMPEG_EXEC:
        return runFfmpeg(
          store,
          decodeFrame<FfmpegExecMeta>(payload),
          ffmpegConfig,
        );
      default:
        throw new Error(`unknown op ${op}`);
    }
  }

  return new SabResponder(sab, handle);
}
