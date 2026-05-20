import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { buildFeed, originFromHeaders } from "@/services/basin/build-feed";

export async function GET() {
  const origin = originFromHeaders(await headers());
  const feed = await buildFeed(origin);
  return new NextResponse(feed.atom1(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
