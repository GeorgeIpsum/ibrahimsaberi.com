import { connection, type NextRequest } from "next/server";
import { env } from "@/env";
import { getDataset } from "../../dataset";
import { selectVoiceline } from "../../select";

// Streams the selected voiceline's bytes from R2 so the response is a true
// first-party `audio/mpeg` file (good for Discord/Slack/iMessage auto-embeds).
// The optional `[[...clip]]` segment lets the URL end in `.mp3`
// (e.g. /api/audio/voice-responses/raw/abaddon.mp3?hero=abaddon) without
// affecting selection. Unlike the redirecting base route this proxies the
// bytes, so it consumes Vercel egress.
export const GET = async (request: NextRequest) => {
  await connection();

  const params = request.nextUrl.searchParams;
  const result = selectVoiceline(getDataset(), {
    hero: params.get("hero"),
    voiceline: params.get("voiceline"),
    category: params.get("category"),
  });

  if (result.status === 404) {
    return new Response("No matching voiceline.", { status: 404 });
  }

  const base = env.CLOUDFLARE_VOICE_PUBLIC_URL;
  if (!base) {
    return new Response("Voice responses storage is not configured.", {
      status: 500,
    });
  }

  const upstream = await fetch(
    `${base.replace(/\/+$/, "")}/${result.line.key}`,
  );
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream audio unavailable.", { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": "audio/mpeg",
    // Selection is random, so don't let the pick get cached and frozen.
    "Cache-Control": "no-store",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { headers });
};
