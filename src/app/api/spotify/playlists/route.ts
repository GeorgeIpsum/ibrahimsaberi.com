import { connection, NextResponse } from "next/server";
import { getMyPlaylists } from "@/services/spotify/playlists";

export async function GET() {
  await connection();
  const playlists = await getMyPlaylists();
  return NextResponse.json({ playlists });
}
