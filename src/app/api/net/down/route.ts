import { randomBytes } from "node:crypto";
import { connection, type NextRequest, NextResponse } from "next/server";
import {
  clampInt,
  DEFAULT_DOWNLOAD_BYTES,
  DEFAULT_DOWNLOAD_MS,
  MAX_DOWNLOAD_BYTES,
  MAX_DOWNLOAD_MS,
  MIN_DOWNLOAD_BYTES,
  MIN_DOWNLOAD_MS,
} from "@/utils/network-quality";

// One block of crypto-random bytes, generated once. Streamed cyclically as the
// download payload. 256 KB exceeds gzip's 32 KB back-reference window, so the
// repeated block stays incompressible to gzip; `no-transform` + octet-stream
// guard against brotli/proxy compression (which would corrupt the measurement,
// since the client counts decompressed bytes received).
const CHUNK_SIZE = 256 * 1024;
const RANDOM_CHUNK = randomBytes(CHUNK_SIZE);

// Download throughput probe: streams up to `bytes` bytes over up to `ms`,
// whichever bound is hit first. Pull-based so production tracks network
// consumption (no buffering of unsent bytes).
export const GET = async (request: NextRequest) => {
  await connection();

  const params = request.nextUrl.searchParams;
  const capBytes = clampInt(
    params.get("bytes"),
    MIN_DOWNLOAD_BYTES,
    MAX_DOWNLOAD_BYTES,
    DEFAULT_DOWNLOAD_BYTES,
  );
  const maxMs = clampInt(
    params.get("ms"),
    MIN_DOWNLOAD_MS,
    MAX_DOWNLOAD_MS,
    DEFAULT_DOWNLOAD_MS,
  );

  let sent = 0;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const finish = (controller: ReadableStreamDefaultController) => {
    if (closed) return;
    closed = true;
    if (timer) clearTimeout(timer);
    controller.close();
  };

  const stream = new ReadableStream({
    start(controller) {
      // Hard server-side time bound: a client that forgets to abort can't hold
      // the connection open past `ms`.
      timer = setTimeout(() => finish(controller), maxMs);
    },
    pull(controller) {
      if (closed) return;
      const remaining = capBytes - sent;
      if (remaining <= 0) {
        finish(controller);
        return;
      }
      const size = Math.min(CHUNK_SIZE, remaining);
      controller.enqueue(RANDOM_CHUNK.subarray(0, size));
      sent += size;
    },
    cancel() {
      closed = true;
      if (timer) clearTimeout(timer);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store, no-transform",
    },
  });
};
