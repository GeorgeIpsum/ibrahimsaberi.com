import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Dataset, Voiceline } from "./select";

// Static path so Turbopack can bound the file trace; `outputFileTracingIncludes`
// in next.config bundles the JSON for production.
const metaDir = join(process.cwd(), "src/app/api/audio/voice-responses/meta");

/**
 * Read the scraped voiceline metadata into an in-memory dataset. Exported with
 * an explicit dir so it can be unit-tested against the real meta folder.
 */
export function loadDataset(dir: string): Dataset {
  const all: Voiceline[] = [];
  const byHero = new Map<string, Voiceline[]>();
  for (const fileName of readdirSync(dir)) {
    if (!fileName.endsWith(".json") || fileName === "index.json") continue;
    const meta = JSON.parse(readFileSync(join(dir, fileName), "utf8"));
    const lines: Voiceline[] = meta.voicelines.map((v: Voiceline) => ({
      slug: meta.slug,
      file: v.file,
      key: v.key,
      transcript: v.transcript,
      categories: v.categories,
    }));
    byHero.set(meta.slug, lines);
    all.push(...lines);
  }
  return { all, byHero };
}

let cached: Dataset | null = null;

/** Memoized dataset for the route handlers — built once per process. */
export function getDataset(): Dataset {
  if (!cached) cached = loadDataset(metaDir);
  return cached;
}
