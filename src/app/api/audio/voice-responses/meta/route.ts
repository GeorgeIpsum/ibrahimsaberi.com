import { connection, type NextRequest } from "next/server";
import { getDataset } from "../dataset";
import { selectVoicelines } from "../select";

export const GET = async (request: NextRequest) => {
  await connection();

  const params = request.nextUrl.searchParams;
  const result = selectVoicelines(getDataset(), {
    hero: params.get("hero"),
    voiceline: params.get("voiceline"),
    category: params.get("category"),
  });

  const mapped = result.map((r) => ({
    hero: r.slug,
    voiceline: r.transcript,
    categories: r.categories,
  }));

  return new Response(JSON.stringify(mapped), {
    headers: { "Content-Type": "application/json" },
  });
};
