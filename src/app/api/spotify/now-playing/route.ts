import { NextResponse } from "next/server";
import { redis } from "@/services/redis";
import { getNowPlaying } from "@/services/spotify/now-playing";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 30;

async function isRateLimited(ip: string): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return false;
  try {
    const key = `ratelimit:now-playing:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SECONDS);
    return count > MAX_REQUESTS;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await isRateLimited(ip)) {
    return NextResponse.json(
      { error: "YOU'RE HURTING ME!!! STOP!!!!!!!!!!!!!!!!!!!!!!!" },
      { status: 429 },
    );
  }
  const track = await getNowPlaying();
  return NextResponse.json({ track });
}
