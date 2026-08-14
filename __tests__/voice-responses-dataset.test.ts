import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadDataset } from "../src/app/api/audio/voice-responses/dataset";
import { selectVoiceline } from "../src/app/api/audio/voice-responses/select";

const metaDir = join(
  import.meta.dirname,
  "..",
  "src",
  "app",
  "api",
  "audio",
  "voice-responses",
  "meta",
);
const dataset = loadDataset(metaDir);
const heroFileCount = readdirSync(metaDir).filter(
  (f) => f.endsWith(".json") && f !== "index.json",
).length;

describe("voice-responses dataset (real scraped metadata)", () => {
  it("loads every hero file and aggregates all voicelines", () => {
    expect(dataset.byHero.size).toBe(heroFileCount);
    const summed = [...dataset.byHero.values()].reduce(
      (n, l) => n + l.length,
      0,
    );
    expect(dataset.all.length).toBe(summed);
    expect(dataset.all.length).toBeGreaterThan(40_000);
  });

  it("every line carries an R2 key and transcript", () => {
    expect(
      dataset.all.every((l) => l.key.startsWith("dota2/") && l.file && l.slug),
    ).toBe(true);
  });

  it("resolves a known hero to one of its own lines", () => {
    const res = selectVoiceline(dataset, { hero: "abaddon" });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    expect(res.line.key.startsWith("dota2/abaddon/")).toBe(true);
  });

  it("404s for an unknown hero", () => {
    expect(selectVoiceline(dataset, { hero: "shrek" }).status).toBe(404);
  });

  it("404s when a pinned hero has no fuzzy match (abaddon has no 'incoming')", () => {
    expect(
      selectVoiceline(dataset, { hero: "abaddon", voiceline: "incoming" })
        .status,
    ).toBe(404);
  });

  it("fuzzy-matches a real transcript for a pinned hero", () => {
    const res = selectVoiceline(dataset, {
      hero: "abaddon",
      voiceline: "Lord of Avernus",
    });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    expect(res.line.transcript.toLowerCase()).toContain("lord of avernus");
  });

  it("filters by exact category across all heroes", () => {
    const res = selectVoiceline(dataset, { category: "Loadout" });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    expect(res.line.categories.map((c) => c.toLowerCase())).toContain(
      "loadout",
    );
  });
});
