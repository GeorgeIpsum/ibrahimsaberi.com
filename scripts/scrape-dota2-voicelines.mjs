#!/usr/bin/env node
// Scrape Dota 2 hero voice responses from Liquipedia.
//
// For each hero it fetches the "/Responses" page via the MediaWiki API, parses
// out every voiceline (mp3 url + transcript + category), downloads the mp3s to
// scraped/audio/dota2/<slug>/ and writes metadata to
// src/app/api/voice-responses/meta/<slug>.json. With --upload it also pushes the
// audio to Cloudflare R2.
//
// Liquipedia's API terms ask for a descriptive User-Agent and rate limiting
// (~1 parse request / 30s); responses are cached under scraped/cache so re-runs
// don't re-hit the API.
//
// Usage:
//   node scripts/scrape-dota2-voicelines.mjs                  # all heroes
//   node scripts/scrape-dota2-voicelines.mjs --heroes "Axe,Pudge"
//   node scripts/scrape-dota2-voicelines.mjs --heroes Axe --upload
//   node scripts/scrape-dota2-voicelines.mjs --dry-run        # metadata only
//   node scripts/scrape-dota2-voicelines.mjs --refresh        # ignore cache
import "dotenv/config";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import {
  heroPageTitle,
  heroSlug,
  parseResponses,
} from "./lib/dota2-responses.mjs";

const HEROES = [
  "Alchemist",
  "Axe",
  "Bristleback",
  "Centaur Warrunner",
  "Chaos Knight",
  "Clockwerk",
  "Dawnbreaker",
  "Doom",
  "Dragon Knight",
  "Earth Spirit",
  "Earthshaker",
  "Elder Titan",
  "Huskar",
  "Kunkka",
  "Largo",
  "Legion Commander",
  "Lifestealer",
  "Lycan",
  "Mars",
  "Night Stalker",
  "Ogre Magi",
  "Omniknight",
  "Phoenix",
  "Primal Beast",
  "Pudge",
  "Slardar",
  "Spirit Breaker",
  "Sven",
  "Tidehunter",
  "Timbersaw",
  "Tiny",
  "Treant Protector",
  "Tusk",
  "Underlord",
  "Undying",
  "Wraith King",
  "Anti-Mage",
  "Bloodseeker",
  "Bounty Hunter",
  "Broodmother",
  "Clinkz",
  "Drow Ranger",
  "Ember Spirit",
  "Faceless Void",
  "Gyrocopter",
  "Hoodwink",
  "Juggernaut",
  "Kez",
  "Lone Druid",
  "Luna",
  "Medusa",
  "Meepo",
  "Mirana",
  "Monkey King",
  "Morphling",
  "Naga Siren",
  "Phantom Assassin",
  "Phantom Lancer",
  "Razor",
  "Riki",
  "Shadow Fiend",
  "Slark",
  "Sniper",
  "Spectre",
  "Templar Assassin",
  "Terrorblade",
  "Troll Warlord",
  "Ursa",
  "Vengeful Spirit",
  "Viper",
  "Weaver",
  "Ancient Apparition",
  "Chen",
  "Crystal Maiden",
  "Dark Seer",
  "Dark Willow",
  "Disruptor",
  "Enchantress",
  "Grimstroke",
  "Invoker",
  "Jakiro",
  "Keeper of the Light",
  "Leshrac",
  "Lich",
  "Lina",
  "Lion",
  "Muerta",
  "Necrophos",
  "Oracle",
  "Outworld Destroyer",
  "Puck",
  "Pugna",
  "Queen of Pain",
  "Ringmaster",
  "Rubick",
  "Shadow Demon",
  "Shadow Shaman",
  "Silencer",
  "Skywrath Mage",
  "Storm Spirit",
  "Tinker",
  "Warlock",
  "Winter Wyvern",
  "Witch Doctor",
  "Zeus",
  "Abaddon",
  "Arc Warden",
  "Bane",
  "Batrider",
  "Beastmaster",
  "Brewmaster",
  "Dazzle",
  "Death Prophet",
  "Enigma",
  "Io",
  "Magnus",
  "Marci",
  "Nature's Prophet",
  "Nyx Assassin",
  "Pangolier",
  "Sand King",
  "Snapfire",
  "Spirit Bear",
  "Techies",
  "Venomancer",
  "Visage",
  "Void Spirit",
  "Windranger",
];

// Liquipedia page titles that don't follow "name with spaces -> underscores".
const PAGE_OVERRIDES = {
  // e.g. "Spirit Bear": "Lone_Druid/Spirit_Bear",
};

const ROOT = process.cwd();
const AUDIO_DIR = path.join(ROOT, "scraped", "audio", "dota2");
const CACHE_DIR = path.join(ROOT, "scraped", "cache", "liquipedia");
const META_DIR = path.join(
  ROOT,
  "src",
  "app",
  "api",
  "voice-responses",
  "meta",
);
const API_URL = "https://liquipedia.net/dota2/api.php";
const USER_AGENT =
  "ibrahimsaberi.com Dota2 voiceline scraper/1.0 (ibrahims@tilli.pro)";
const R2_ENV = [
  "CLOUDFLARE_S3_ENDPOINT",
  "CLOUDFLARE_ACCESS_KEY_ID",
  "CLOUDFLARE_SECRET_ACCESS_KEY",
  "CLOUDFLARE_VOICE_BUCKET_NAME",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

/** Run `fn` over `items` with at most `concurrency` in flight. */
async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

let lastFetchAt = 0;
/** Fetch a hero's rendered Responses HTML, cache-first and rate-limited. */
async function fetchResponsesHtml(hero, slug, { refresh, parseDelayMs }) {
  const cachePath = path.join(CACHE_DIR, `${slug}.html`);
  if (!refresh && (await exists(cachePath))) {
    return { html: await readFile(cachePath, "utf8"), cached: true };
  }

  const wait = parseDelayMs - (Date.now() - lastFetchAt);
  if (lastFetchAt && wait > 0) await sleep(wait);

  const page = `${PAGE_OVERRIDES[hero] ?? heroPageTitle(hero)}/Responses`;
  const url = `${API_URL}?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&redirects=1`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  lastFetchAt = Date.now();
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${page}`);
  const json = await res.json();
  if (json.error) throw new Error(`${json.error.code}: ${json.error.info}`);
  const html = json.parse?.text?.["*"];
  if (!html) throw new Error(`empty parse result for ${page}`);

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, html);
  return { html, cached: false };
}

/** Download one mp3 to disk unless it already exists. Returns bytes written or null if skipped. */
async function downloadMp3(line, slug) {
  const dest = path.join(AUDIO_DIR, slug, line.filename);
  if (await exists(dest)) return { status: "skipped", bytes: 0 };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(line.sourceUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, buf);
      return { status: "downloaded", bytes: buf.length };
    } catch (err) {
      if (attempt === 3) return { status: "failed", error: String(err) };
      await sleep(500 * attempt);
    }
  }
}

async function uploadToR2(s3, bucket, key, body, refresh) {
  if (!refresh) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return "exists";
    } catch (err) {
      const code = err?.$metadata?.httpStatusCode;
      if (code !== 404 && err?.name !== "NotFound") throw err;
    }
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "audio/mpeg",
    }),
  );
  return "uploaded";
}

/** Read the existing index (if any) so per-hero runs accumulate. */
async function readIndex() {
  const p = path.join(META_DIR, "index.json");
  if (!(await exists(p))) return {};
  try {
    const data = JSON.parse(await readFile(p, "utf8"));
    return Object.fromEntries((data.heroes ?? []).map((h) => [h.slug, h]));
  } catch {
    return {};
  }
}

async function main() {
  const program = new Command();
  program
    .option("--heroes <list>", "comma-separated hero names (default: all)")
    .option("--upload", "also upload downloaded audio to Cloudflare R2", false)
    .option(
      "--dry-run",
      "parse + write metadata only; skip audio download",
      false,
    )
    .option("--refresh", "ignore cached pages / re-upload existing keys", false)
    .option("--parse-delay <seconds>", "delay between API page fetches", "30")
    .option("--concurrency <n>", "parallel mp3 downloads per hero", "5")
    .option("--limit <n>", "cap voicelines per hero (debug)")
    .parse();
  const opts = program.opts();

  const parseDelayMs = Number(opts.parseDelay) * 1000;
  const concurrency = Number(opts.concurrency);
  const limit = opts.limit ? Number(opts.limit) : null;

  let heroes = HEROES;
  if (opts.heroes) {
    const requested = opts.heroes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const byLower = new Map(HEROES.map((h) => [h.toLowerCase(), h]));
    heroes = [];
    for (const name of requested) {
      const match = byLower.get(name.toLowerCase());
      if (!match) {
        console.error(chalk.red(`Unknown hero: "${name}"`));
        process.exit(1);
      }
      heroes.push(match);
    }
  }

  let s3 = null;
  const bucket = process.env.CLOUDFLARE_VOICE_BUCKET_NAME;
  if (opts.upload) {
    const missing = R2_ENV.filter((k) => !process.env[k]);
    if (missing.length) {
      console.error(chalk.red(`Missing R2 env vars: ${missing.join(", ")}`));
      process.exit(1);
    }
    s3 = new S3Client({
      region: "auto",
      endpoint: process.env.CLOUDFLARE_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
      },
    });
  }

  await mkdir(META_DIR, { recursive: true });
  const index = await readIndex();
  const totals = {
    heroes: 0,
    lines: 0,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    uploaded: 0,
    bytes: 0,
  };
  const problems = [];

  console.log(
    chalk.bold(
      `\nScraping ${heroes.length} hero(es)` +
        `${opts.dryRun ? " [dry-run]" : ""}${opts.upload ? " [+R2 upload]" : ""}\n`,
    ),
  );

  for (const hero of heroes) {
    const slug = heroSlug(hero);
    const spin = ora(hero).start();
    try {
      const { html, cached } = await fetchResponsesHtml(hero, slug, {
        refresh: opts.refresh,
        parseDelayMs,
      });
      let lines = parseResponses(html);
      if (limit) lines = lines.slice(0, limit);
      totals.lines += lines.length;

      const voicelines = lines.map((l) => ({
        file: l.filename,
        key: `dota2/${slug}/${l.filename}`,
        transcript: l.transcript,
        categories: l.categories,
        unused: l.unused,
        sourceUrl: l.sourceUrl,
      }));

      let downloaded = 0;
      let skipped = 0;
      let failed = 0;
      let uploaded = 0;
      if (!opts.dryRun) {
        await mapPool(lines, concurrency, async (line, i) => {
          spin.text = `${hero}  ${i + 1}/${lines.length}`;
          const dl = await downloadMp3(line, slug);
          if (dl.status === "downloaded") {
            downloaded++;
            totals.bytes += dl.bytes;
          } else if (dl.status === "skipped") {
            skipped++;
          } else {
            failed++;
            problems.push(`${hero}: ${line.filename} — ${dl.error}`);
            return;
          }
          if (s3) {
            const dest = path.join(AUDIO_DIR, slug, line.filename);
            const body = await readFile(dest);
            const r = await uploadToR2(
              s3,
              bucket,
              `dota2/${slug}/${line.filename}`,
              body,
              opts.refresh,
            );
            if (r === "uploaded") uploaded++;
          }
        });
      }

      await writeFile(
        path.join(META_DIR, `${slug}.json`),
        `${JSON.stringify(
          {
            hero,
            slug,
            source: `https://liquipedia.net/dota2/${heroPageTitle(hero)}/Responses`,
            scrapedAt: new Date().toISOString(),
            count: voicelines.length,
            voicelines,
          },
          null,
          2,
        )}\n`,
      );

      index[slug] = {
        hero,
        slug,
        count: voicelines.length,
        metaFile: `${slug}.json`,
      };
      totals.heroes++;
      totals.downloaded += downloaded;
      totals.skipped += skipped;
      totals.failed += failed;
      totals.uploaded += uploaded;

      const bits = [`${voicelines.length} lines`];
      if (!opts.dryRun)
        bits.push(`${downloaded} dl`, `${skipped} skip`, `${failed} fail`);
      if (s3) bits.push(`${uploaded} up`);
      bits.push(cached ? chalk.dim("cached") : chalk.dim("fetched"));
      spin.succeed(`${chalk.cyan(hero)}  ${bits.join("  ")}`);
    } catch (err) {
      problems.push(`${hero}: ${err.message ?? err}`);
      spin.fail(`${chalk.yellow(hero)}  ${chalk.red(err.message ?? err)}`);
    }
  }

  const heroesSorted = Object.values(index).sort((a, b) =>
    a.hero.localeCompare(b.hero),
  );
  await writeFile(
    path.join(META_DIR, "index.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        heroCount: heroesSorted.length,
        voicelineCount: heroesSorted.reduce((n, h) => n + h.count, 0),
        heroes: heroesSorted,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    chalk.bold(
      `\nDone. ${totals.heroes}/${heroes.length} heroes, ${totals.lines} voicelines.`,
    ),
  );
  if (!opts.dryRun)
    console.log(
      `  audio: ${totals.downloaded} downloaded, ${totals.skipped} already on disk, ${totals.failed} failed` +
        ` (${(totals.bytes / 1e6).toFixed(1)} MB this run)`,
    );
  if (opts.upload) console.log(`  R2: ${totals.uploaded} uploaded`);
  if (problems.length) {
    console.log(chalk.yellow(`\n${problems.length} problem(s):`));
    for (const p of problems) console.log(chalk.dim(`  - ${p}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
