import { NextResponse } from "next/server";
import { isRateLimited } from "@/services/redis";
import {
  getNowPlaying,
  withLiveProgress,
} from "@/services/spotify/now-playing";

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await isRateLimited("now-playing", ip)) {
    return NextResponse.json(
      { error: "YOU'RE HURTING ME!!! STOP!!!!!!!!!!!!!!!!!!!!!!!" },
      { status: 429 },
    );
  }
  const track = await getNowPlaying();
  return NextResponse.json({
    track: track && withLiveProgress(track, Date.now()),
  });
}
