// Pure selection logic for the voice-responses route. No I/O so it can be
// unit-tested directly; the route handler supplies the dataset and turns the
// result into a redirect or 404.

export type Voiceline = {
  slug: string;
  file: string;
  /** R2 object key, e.g. "dota2/abaddon/Vo_abaddon_abad_spawn_02.mp3". */
  key: string;
  transcript: string;
  categories: string[];
};

export type Dataset = {
  all: Voiceline[];
  byHero: Map<string, Voiceline[]>;
};

export type SelectParams = {
  hero?: string | null;
  voiceline?: string | null;
  category?: string | null;
};

export type SelectResult = { status: 200; line: Voiceline } | { status: 404 };

/** Hero name -> slug, matching how the scraper named folders/metadata. */
export function toHeroSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Fuzzy: true when every word of the query appears somewhere in the transcript. */
function fuzzyMatches(transcript: string, query: string): boolean {
  const haystack = normalize(transcript);
  const tokens = normalize(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((token) => haystack.includes(token));
}

const pick = (lines: Voiceline[], rng: () => number) =>
  lines[Math.floor(rng() * lines.length)];

export function selectVoiceline(
  dataset: Dataset,
  params: SelectParams,
  rng: () => number = Math.random,
): SelectResult {
  const heroSpecified = Boolean(params.hero?.trim());

  let pool: Voiceline[];
  if (heroSpecified) {
    const found = dataset.byHero.get(toHeroSlug(params.hero as string));
    if (!found?.length) return { status: 404 };
    pool = found;
  } else {
    pool = dataset.all;
  }

  // Category: discrete + best-effort. Apply only if it narrows to >=1 line,
  // otherwise silently drop it. Never 404s on its own.
  const category = params.category?.trim();
  if (category) {
    const byCategory = pool.filter((line) =>
      line.categories.some((c) => c.toLowerCase() === category.toLowerCase()),
    );
    if (byCategory.length > 0) pool = byCategory;
  }

  // Voiceline: fuzzy. With a hero pinned a miss is a 404; without one we fall
  // back to the (un-fuzzed) pool.
  const voiceline = params.voiceline?.trim();
  if (voiceline) {
    const matched = pool.filter((line) =>
      fuzzyMatches(line.transcript, voiceline),
    );
    if (matched.length > 0) {
      pool = matched;
    } else if (heroSpecified) {
      return { status: 404 };
    }
  }

  if (pool.length === 0) return { status: 404 };
  return { status: 200, line: pick(pool, rng) };
}

export function selectVoicelines(
  dataset: Dataset,
  params: SelectParams,
): Voiceline[] {
  const heroSpecified = Boolean(params.hero?.trim());

  let pool: Voiceline[];
  if (heroSpecified) {
    const found = dataset.byHero.get(toHeroSlug(params.hero as string));
    if (!found?.length) return [];
    pool = found;
  } else {
    pool = dataset.all;
  }

  const category = params.category?.trim();
  if (category) {
    const byCategory = pool.filter((line) =>
      line.categories.some((c) => c.toLowerCase() === category.toLowerCase()),
    );
    if (byCategory.length > 0) pool = byCategory;
  }

  const voiceline = params.voiceline?.trim();
  if (voiceline) {
    const matched = pool.filter((line) =>
      fuzzyMatches(line.transcript, voiceline),
    );
    if (matched.length > 0) {
      pool = matched;
    } else if (heroSpecified) {
      return [];
    }
  }

  return pool;
}
