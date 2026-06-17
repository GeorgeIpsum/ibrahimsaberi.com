import { describe, expect, it } from "vitest";
import {
  type Dataset,
  selectVoiceline,
  toHeroSlug,
  type Voiceline,
} from "../src/app/api/voice-responses/select";

const line = (
  slug: string,
  file: string,
  transcript: string,
  categories: string[],
): Voiceline => ({
  slug,
  file,
  key: `dota2/${slug}/${file}`,
  transcript,
  categories,
});

// abaddon has no "incoming" line; axe does. Used to exercise the 404 vs
// fall-back-to-all behaviour.
const abaddon = [
  line("abaddon", "Vo_abaddon_abad_spawn_02.mp3", "I am the Lord of Avernus.", [
    "Loadout",
  ]),
  line("abaddon", "Vo_abaddon_abad_spawn_01.mp3", "Abaddon.", ["Loadout"]),
  line("abaddon", "Vo_abaddon_abad_move_01.mp3", "Onward.", ["Moving"]),
];
const axe = [
  line("axe", "Vo_axe_axe_spawn_01.mp3", "Axe!", ["Loadout"]),
  line("axe", "Vo_axe_axe_damage_01.mp3", "Incoming!", ["Taking damage"]),
  line("axe", "Vo_axe_axe_move_01.mp3", "Enemies need killing!", ["Moving"]),
];

const dataset: Dataset = {
  all: [...abaddon, ...axe],
  byHero: new Map([
    ["abaddon", abaddon],
    ["axe", axe],
  ]),
};

const files = (lines: Voiceline[]) => lines.map((l) => l.file);

describe("toHeroSlug", () => {
  it("lowercases and dashes hero names, dropping apostrophes", () => {
    expect(toHeroSlug("Abaddon")).toBe("abaddon");
    expect(toHeroSlug("abaddon")).toBe("abaddon");
    expect(toHeroSlug("ANTI-MAGE")).toBe("anti-mage");
    expect(toHeroSlug("Nature's Prophet")).toBe("natures-prophet");
  });
});

describe("selectVoiceline", () => {
  it("404s when a hero param does not match a known hero", () => {
    expect(selectVoiceline(dataset, { hero: "shrek" }).status).toBe(404);
  });

  it("returns a random line for the hero when only hero is given", () => {
    const res = selectVoiceline(dataset, { hero: "abaddon" });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    expect(files(abaddon)).toContain(res.line.file);
  });

  it("returns the matching hero line when voiceline matches", () => {
    const res = selectVoiceline(dataset, {
      hero: "abaddon",
      voiceline: "Lord of Avernus",
    });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    expect(res.line.file).toBe("Vo_abaddon_abad_spawn_02.mp3");
  });

  it("404s when hero is given but the voiceline matches nothing for that hero", () => {
    // "incoming" exists in the corpus (axe) but not for abaddon.
    expect(
      selectVoiceline(dataset, { hero: "abaddon", voiceline: "incoming" })
        .status,
    ).toBe(404);
    // gibberish likewise 404s once a hero is pinned.
    expect(
      selectVoiceline(dataset, { hero: "abaddon", voiceline: "asdf" }).status,
    ).toBe(404);
  });

  it("falls back to a random line from all heroes when a hero-less voiceline matches nothing", () => {
    const res = selectVoiceline(dataset, { voiceline: "asdf" });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    expect(files(dataset.all)).toContain(res.line.file);
  });

  it("fuzzy-matches a voiceline across all heroes when no hero is given", () => {
    const res = selectVoiceline(dataset, { voiceline: "incoming" });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    expect(res.line.file).toBe("Vo_axe_axe_damage_01.mp3");
  });

  it("filters by exact category across all heroes", () => {
    const res = selectVoiceline(dataset, { category: "Loadout" });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    const loadout = dataset.all.filter((l) => l.categories.includes("Loadout"));
    expect(files(loadout)).toContain(res.line.file);
  });

  it("matches category case-insensitively", () => {
    const res = selectVoiceline(dataset, { category: "loadout" });
    expect(res.status).toBe(200);
  });

  it("drops an unknown category but keeps the voiceline filter", () => {
    const res = selectVoiceline(dataset, {
      voiceline: "incoming",
      category: "asdf",
    });
    expect(res.status).toBe(200);
    if (res.status !== 200) return;
    expect(res.line.file).toBe("Vo_axe_axe_damage_01.mp3");
  });
});
