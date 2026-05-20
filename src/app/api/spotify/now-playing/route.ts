import { connection, NextResponse } from "next/server";
import { getNowPlaying } from "@/services/spotify/now-playing";

export async function GET() {
  await connection();
  const track = await getNowPlaying();
  return NextResponse.json({ track });
}
