import { connection, type NextRequest, NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MS } from "@/utils/network-quality";

// Upload throughput probe: drains the request body and acks with the byte
// count. The *client* does the timing (XHR upload-progress events) — server
// arrival timing would be meaningless behind proxies that buffer request
// bodies before invoking the function, as Vercel does.
export const POST = async (request: NextRequest) => {
  await connection();

  const body = request.body;
  if (!body) {
    return NextResponse.json({ error: "missing body" }, { status: 400 });
  }

  const reader = body.getReader();
  const deadline = Date.now() + MAX_UPLOAD_MS;
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value?.length ?? 0;
      // Hard caps: a client can't hold the connection open past MAX_UPLOAD_MS
      // or push more than MAX_UPLOAD_BYTES through it.
      if (received > MAX_UPLOAD_BYTES) {
        await reader.cancel();
        return NextResponse.json(
          { error: "payload too large" },
          { status: 413, headers: { "Cache-Control": "no-store" } },
        );
      }
      if (Date.now() > deadline) {
        await reader.cancel();
        break;
      }
    }
  } catch {
    // Aborted mid-upload (client bailed): nothing to ack.
    return NextResponse.json(
      { error: "upload interrupted" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { received },
    { headers: { "Cache-Control": "no-store" } },
  );
};
