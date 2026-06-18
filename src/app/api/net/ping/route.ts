import { connection, NextResponse } from "next/server";

// Latency probe: empty 204 so a round-trip costs ~no bytes. The client times
// requests against it.
export const GET = async () => {
  await connection();

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
};
