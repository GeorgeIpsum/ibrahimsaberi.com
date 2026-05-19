import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { TZDate } from "@date-fns/tz";
import frontMatter from "front-matter";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FrontmatterSchema, type Post, type PostListEntry } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "src/content");

// All bare YAML dates (`publishedAt: 2026-05-18`) and filename-encoded dates
// are interpreted as midnight in this timezone. TZDate carries its tz with it
// so `toLocaleDateString()` formats in this tz automatically.
export const AUTHOR_TIMEZONE = "America/New_York";

// Convention: every published post lives at `src/content/YYYY-MM-DD-<slug>.mdx`.
// The filename date is the source of truth for publishedAt — drives both the
// sort order (free lexicographic = chronological) and the value injected into
// the frontmatter before schema validation.
const FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})-(.+)\.mdx$/;

type FileEntry = {
  file: string; // "2026-05-18-welcome.mdx"
  slug: string; // "welcome"
  dateStr: string; // "2026-05-18"
};

function dateFromStr(s: string): TZDate {
  const [y, m, d] = s.split("-").map(Number);
  return new TZDate(y, m - 1, d, AUTHOR_TIMEZONE);
}

function normalizeAttributes(
  attrs: Record<string, unknown>,
  dateStrFromFilename: string,
): Record<string, unknown> {
  const out = { ...attrs };
  // Filename always wins. Any `publishedAt` in frontmatter is overridden — keep
  // it for human-readability but the authoritative date is the filename prefix.
  out.publishedAt = dateFromStr(dateStrFromFilename);
  return out;
}

// Cheap layer: directory scan + filename parse only. No file reads, no YAML
// parsing. Used wherever we just need sort order, count, or to find a file
// by slug.
const _listFileEntries = cache(async (): Promise<FileEntry[]> => {
  const files = await readdir(CONTENT_DIR);
  return files
    .map((f): FileEntry | null => {
      const m = f.match(FILE_PATTERN);
      if (!m) return null;
      return { file: f, dateStr: m[1], slug: m[2] };
    })
    .filter((e): e is FileEntry => e !== null)
    .sort((a, b) => b.dateStr.localeCompare(a.dateStr));
});

async function parseEntry(entry: FileEntry): Promise<PostListEntry> {
  const raw = await readFile(path.join(CONTENT_DIR, entry.file), "utf-8");
  const { attributes } = frontMatter<Record<string, unknown>>(raw);
  return {
    slug: entry.slug,
    frontmatter: FrontmatterSchema.assert(
      normalizeAttributes(attributes, entry.dateStr),
    ),
  };
}

// Expensive layer: reads + parses every post. Used when we need frontmatter
// data for filtering (tags, drafts) or full enumeration.
const _listAllParsed = cache(async (): Promise<PostListEntry[]> => {
  const entries = await _listFileEntries();
  const parsed = await Promise.all(entries.map(parseEntry));
  return process.env.NODE_ENV === "production"
    ? parsed.filter((p) => !p.frontmatter.draft)
    : parsed;
});

export type ListPostsOptions = {
  /** Slice this many posts from the start of the (filtered) list. */
  take?: number;
  /** Drop this many posts from the start before slicing. */
  skip?: number;
  /** Only include posts whose tags include this string. */
  tag?: string;
};

export async function listPosts(
  opts: ListPostsOptions = {},
): Promise<PostListEntry[]> {
  const skip = opts.skip ?? 0;

  // Cheap path: no filtering, dev mode (no draft filter needed). We can slice
  // the filename list first, then parse only the N files we actually need.
  if (!opts.tag && process.env.NODE_ENV !== "production") {
    const entries = await _listFileEntries();
    const sliced =
      opts.take !== undefined
        ? entries.slice(skip, skip + opts.take)
        : entries.slice(skip);
    return Promise.all(sliced.map(parseEntry));
  }

  // Expensive path: tag filter or production (drafts must be excluded). Have
  // to parse everything to apply the filter; then slice the filtered result.
  const all = opts.tag
    ? (await _listAllParsed()).filter((p) =>
        p.frontmatter.tags?.includes(opts.tag as string),
      )
    : await _listAllParsed();
  return opts.take !== undefined
    ? all.slice(skip, skip + opts.take)
    : all.slice(skip);
}

export async function countPosts(
  opts: Pick<ListPostsOptions, "tag"> = {},
): Promise<number> {
  // Tag filter or production: must parse to filter accurately.
  if (opts.tag || process.env.NODE_ENV === "production") {
    const all = opts.tag
      ? (await _listAllParsed()).filter((p) =>
          p.frontmatter.tags?.includes(opts.tag as string),
        )
      : await _listAllParsed();
    return all.length;
  }
  // Cheap path: count files only.
  return (await _listFileEntries()).length;
}

export async function listTags(): Promise<string[]> {
  const all = await _listAllParsed();
  const tags = new Set<string>();
  for (const p of all) {
    for (const t of p.frontmatter.tags ?? []) tags.add(t);
  }
  return Array.from(tags);
}

export const loadPost = cache(async (slug: string): Promise<Post> => {
  const entries = await _listFileEntries();
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) notFound();

  try {
    const raw = await readFile(path.join(CONTENT_DIR, entry.file), "utf-8");
    const { attributes } = frontMatter<Record<string, unknown>>(raw);
    const frontmatter = FrontmatterSchema.assert(
      normalizeAttributes(attributes, entry.dateStr),
    );

    // The dynamic import path needs a single interpolation slot for Turbopack
    // to statically capture `@/content/*.mdx`. Strip the .mdx extension first.
    const basename = entry.file.replace(/\.mdx$/, "");
    const mod = await import(`@/content/${basename}.mdx`);
    return { slug, frontmatter, Content: mod.default };
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message.includes("Cannot find module") || e.message.includes("ENOENT"))
    ) {
      notFound();
    }
    throw e;
  }
});
