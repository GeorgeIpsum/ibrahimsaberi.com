import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  heroPageTitle,
  heroSlug,
  parseResponses,
} from "../scripts/lib/dota2-responses.mjs";

const axeHtml = readFileSync(
  path.join(import.meta.dirname, "fixtures", "dota2-axe-responses.html"),
  "utf8",
);

const find = (lines: ReturnType<typeof parseResponses>, file: string) => {
  const line = lines.find((l) => l.filename === file);
  if (!line) throw new Error(`no voiceline for ${file}`);
  return line;
};

describe("parseResponses", () => {
  const lines = parseResponses(axeHtml);

  it("extracts one entry per unique mp3 (deduped across sections)", () => {
    // Axe fixture has 308 <audio> refs but 285 unique mp3 URLs.
    expect(lines.length).toBe(285);
    const urls = new Set(lines.map((l) => l.sourceUrl));
    expect(urls.size).toBe(lines.length);
  });

  it("captures filename, absolute source url, transcript and category", () => {
    const spawn = find(lines, "Vo_axe_axe_spawn_01.mp3");
    expect(spawn.sourceUrl).toBe(
      "https://liquipedia.net/commons/images/5/5e/Vo_axe_axe_spawn_01.mp3",
    );
    expect(spawn.transcript).toBe("Axe!");
    expect(spawn.categories).toContain("Loadout");
    expect(spawn.unused).toBe(false);
  });

  it("reads the transcript text that follows the audio button", () => {
    expect(find(lines, "Vo_axe_axe_spawn_02.mp3").transcript).toBe(
      "There is no team in Axe!",
    );
  });

  it("flags unused responses and strips the 'u' marker from the transcript", () => {
    const line = find(lines, "Vo_axe_axe_spawn_06.mp3");
    expect(line.unused).toBe(true);
    expect(line.transcript).toBe("Axe lives!");
  });

  it("drops <small> editorial annotations from the transcript", () => {
    // Raw: <i><small><abbr title="Unused response">u</abbr></small></i>
    //      <dl><dd><sup>Yar!</sup> <small>This line is used during ...</small></dd></dl>
    const line = find(lines, "Vo_axe_axe_ability_berserk_05.mp3");
    expect(line.transcript).toBe("Yar!");
    expect(line.unused).toBe(true);
  });

  it("never leaks markup or the unused marker into transcripts", () => {
    for (const line of lines) {
      expect(line.transcript.length).toBeGreaterThan(0);
      expect(line.transcript).not.toMatch(/[<>]/);
      expect(line.transcript).not.toMatch(/Unused response/);
    }
  });

  it("derives categories from the section headings, skipping the TOC", () => {
    const categories = new Set(lines.flatMap((l) => l.categories));
    expect(categories).toContain("Loadout");
    expect(categories).toContain("Moving");
    expect(categories).toContain("Attacking");
    expect(categories).toContain("Dying");
    expect(categories).not.toContain("Contents");
  });
});

describe("heroSlug", () => {
  it("kebab-cases hero names and drops apostrophes", () => {
    expect(heroSlug("Axe")).toBe("axe");
    expect(heroSlug("Anti-Mage")).toBe("anti-mage");
    expect(heroSlug("Nature's Prophet")).toBe("natures-prophet");
    expect(heroSlug("Outworld Destroyer")).toBe("outworld-destroyer");
    expect(heroSlug("Queen of Pain")).toBe("queen-of-pain");
  });
});

describe("heroPageTitle", () => {
  it("converts spaces to underscores and keeps apostrophes/hyphens", () => {
    expect(heroPageTitle("Axe")).toBe("Axe");
    expect(heroPageTitle("Anti-Mage")).toBe("Anti-Mage");
    expect(heroPageTitle("Nature's Prophet")).toBe("Nature's_Prophet");
  });
});
