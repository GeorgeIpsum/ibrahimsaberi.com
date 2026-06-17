import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { TZDate } from "@date-fns/tz";
import frontMatter from "front-matter";
import { notFound } from "next/navigation";
import { cache } from "react";
import { classifyContentPath } from "./content-paths";
import { FrontmatterSchema, type Post, type PostListEntry } from "./types";

const BASIN_REL_PATH = "src/basin";
const BASIN_DIR = path.join(process.cwd(), BASIN_REL_PATH);
const DROP_DIR = path.join(BASIN_DIR, "drops");
const DROP_IMPORT_PREFIX = "@/basin/drops/";
const DROPLET_DIR = path.join(BASIN_DIR, "droplets");
const DROPLET_IMPORT_PREFIX = "@/basin/droplets/";

// All bare YAML dates (`publishedAt: 2026-05-18`) and filename-encoded dates
// are interpreted as midnight in this timezone. TZDate carries its tz with it
// so `toLocaleDateString()` formats in this tz automatically.
export const AUTHOR_TIMEZONE = "America/New_York";

type FileEntry = {
  file: string; // path relative to CONTENT_DIR, POSIX sep: "2024/2024-01-08-post.mdx"
  slug: string; // "post"
  dateStr: string; // "2024-01-08"
};

function isoFromFilenameDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new TZDate(y, m - 1, d, AUTHOR_TIMEZONE).toISOString();
}

function normalizeAttributes(
  attrs: Record<string, unknown>,
  dateStrFromFilename: string,
): Record<string, unknown> {
  const out = { ...attrs };
  // Filename always wins. Any `publishedAt` in frontmatter is overridden — keep
  // it for human-readability but the authoritative date is the filename prefix.
  out.publishedAt = isoFromFilenameDate(dateStrFromFilename);
  return out;
}

// Emit one warning per slug shared by two or more files. Duplicate slugs are
// allowed (loadDropMeta resolves to the newest by date) but worth surfacing.
function warnDuplicateSlugs(entries: FileEntry[]): void {
  const bySlug = new Map<string, string[]>();
  for (const e of entries) {
    const files = bySlug.get(e.slug);
    if (files) files.push(e.file);
    else bySlug.set(e.slug, [e.file]);
  }
  for (const [slug, files] of bySlug) {
    if (files.length > 1) {
      console.warn(
        `Duplicate post slug "${slug}" — ${files.length} files: ${files.join(", ")}`,
      );
    }
  }
}

const _listFileEntries = cache(async (): Promise<FileEntry[]> => {
  "use cache";
  const paths = await readdir(DROP_DIR, { recursive: true });
  const entries: FileEntry[] = [];
  const invalid: { file: string; reason: string }[] = [];

  for (const rel of paths) {
    if (!rel.endsWith(".mdx")) continue;
    const classified = classifyContentPath(rel);
    if (classified.kind === "skip") continue;
    if (classified.kind === "invalid") {
      invalid.push({ file: classified.file, reason: classified.reason });
      continue;
    }
    entries.push({
      file: classified.file,
      dateStr: classified.dateStr,
      slug: classified.slug,
    });
  }

  if (invalid.length > 0) {
    const list = invalid
      .map((e) => `  - ${BASIN_REL_PATH}/${e.file}: ${e.reason}`)
      .join("\n");
    throw new Error(`Invalid content placement:\n${list}`);
  }

  warnDuplicateSlugs(entries);
  return entries.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
});

async function parseEntry(entry: FileEntry): Promise<PostListEntry> {
  const raw = await readFile(path.join(DROP_DIR, entry.file), "utf-8");
  const { attributes } = frontMatter<Record<string, unknown>>(raw);
  return {
    slug: entry.slug,
    frontmatter: FrontmatterSchema.assert(
      normalizeAttributes(attributes, entry.dateStr),
    ),
  };
}

const _listAllParsed = cache(async (): Promise<PostListEntry[]> => {
  "use cache";
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
  "use cache";
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
  "use cache";
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
  "use cache";
  const all = await _listAllParsed();
  const tags = new Set<string>();
  for (const p of all) {
    for (const t of p.frontmatter.tags ?? []) tags.add(t);
  }
  return Array.from(tags);
}

export type PostMeta = {
  slug: string;
  frontmatter: Post["frontmatter"];
  basename: string;
};

export async function loadDropMeta(slug: string): Promise<PostMeta | null> {
  "use cache";
  const entries = await _listFileEntries();
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) return null;

  const raw = await readFile(path.join(DROP_DIR, entry.file), "utf-8");
  const { attributes } = frontMatter<Record<string, unknown>>(raw);
  const frontmatter = FrontmatterSchema.assert(
    normalizeAttributes(attributes, entry.dateStr),
  );
  const basename = entry.file.replace(/\.mdx$/, "");
  return { slug, frontmatter, basename };
}

export const loadDrop = cache(async (slug: string): Promise<Post> => {
  const meta = await loadDropMeta(slug);
  if (!meta) notFound();
  try {
    const mod = await import(`${DROP_IMPORT_PREFIX}${meta.basename}.mdx`);
    return { slug, frontmatter: meta.frontmatter, Content: mod.default };
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message.includes("Cannot find module") || e.message.includes("ENOENT"))
    ) {
      // this throws
      notFound();
    }
    throw e;
  }
});
