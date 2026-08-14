import { connection, type NextRequest, NextResponse } from "next/server";

// Latency probe: empty 204 so a round-trip costs ~no bytes. The client times
// requests against it. It doubles as the metadata probe: Vercel's geo request
// headers (which only the server sees) are echoed back as x-net-* response
// headers — headers are free, the body stays empty — so the client can learn
// where it's measuring *from*. Which edge it's talking to comes from
// x-vercel-id, which the platform stamps on the response by itself.
const GEO_ECHO: Array<[requestHeader: string, responseHeader: string]> = [
  ["x-vercel-ip-city", "x-net-ip-city"],
  ["x-vercel-ip-country-region", "x-net-ip-country-region"],
  ["x-vercel-ip-country", "x-net-ip-country"],
];

export const GET = async (request: NextRequest) => {
  await connection();

  const headers = new Headers({
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  });
  for (const [from, to] of GEO_ECHO) {
    const value = request.headers.get(from);
    if (value) headers.set(to, value);
  }

  return new NextResponse(null, { status: 204, headers });
};
