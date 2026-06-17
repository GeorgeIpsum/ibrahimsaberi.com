import { join } from "node:path";
import { connection, type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { loadDataset } from "./dataset";
import { selectVoiceline } from "./select";

const metaRoot = join(process.cwd(), "src/app/api/voice-responses/meta");

// Built once at module load from the committed metadata.
const dataset = loadDataset(metaRoot);

export const GET = async (request: NextRequest) => {
  await connection();

  const params = request.nextUrl.searchParams;
  const result = selectVoiceline(dataset, {
    hero: params.get("hero"),
    voiceline: params.get("voiceline"),
    category: params.get("category"),
  });

  // A miss is a client error regardless of storage config, so resolve it first.
  if (result.status === 404) {
    return new Response("No matching voiceline.", { status: 404 });
  }

  const base = env.CLOUDFLARE_VOICE_PUBLIC_URL;
  if (!base) {
    return new Response("Voice responses storage is not configured.", {
      status: 500,
    });
  }

  return NextResponse.redirect(
    `${base.replace(/\/+$/, "")}/${result.line.key}`,
    302,
  );
};
