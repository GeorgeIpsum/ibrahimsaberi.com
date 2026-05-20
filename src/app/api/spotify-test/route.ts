import { NextResponse } from "next/server";
import { getNowPlaying } from "@/services/spotify/now-playing";

export async function GET() {
  const track = await getNowPlaying();
  return NextResponse.json({ track });
}
