import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Dataset, Voiceline } from "./select";

/**
 * Load the scraped voiceline metadata into an in-memory dataset. Called once at
 * module load by the route with a static path so Turbopack can bound the file
 * trace; `outputFileTracingIncludes` bundles the JSON for production.
 */
export function loadDataset(metaDir: string): Dataset {
  const all: Voiceline[] = [];
  const byHero = new Map<string, Voiceline[]>();
  for (const fileName of readdirSync(metaDir)) {
    if (!fileName.endsWith(".json") || fileName === "index.json") continue;
    const meta = JSON.parse(readFileSync(join(metaDir, fileName), "utf8"));
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
