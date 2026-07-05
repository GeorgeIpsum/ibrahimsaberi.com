import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { TZDate } from "@date-fns/tz";
import frontMatter from "front-matter";
import { notFound } from "next/navigation";
import { cache } from "react";
import { classifyContentPath } from "./content-paths";
import {
  type DropletFrontmatter,
  DropletFrontmatterSchema,
  type Post,
  type PostListEntry,
  type RippleFrontmatter,
  RippleFrontmatterSchema,
} from "./types";

const BASIN_REL_PATH = "src/basin";
const BASIN_DIR = path.join(process.cwd(), BASIN_REL_PATH);

// All bare YAML dates (`publishedAt: 2026-05-18`) and filename-encoded dates
// are interpreted as midnight in this timezone. TZDate carries its tz with it
// so `toLocaleDateString()` formats in this tz automatically.
export const AUTHOR_TIMEZONE = "America/New_York";

export type SectionName = "ripples" | "droplets";

export type SectionFrontmatter = {
  ripples: RippleFrontmatter;
  droplets: DropletFrontmatter;
};

type AnyFrontmatter = RippleFrontmatter | DropletFrontmatter;

// Per-section config stays at module scope on purpose: the "use cache"
// functions below may only receive serializable arguments and closure values,
// so they take the section *name* and look up schemas and import thunks here.
// Each import expression keeps its static path prefix for the bundler.
const SECTIONS = {
  ripples: {
    schema: RippleFrontmatterSchema,
    slugOptional: false,
    importContent: (basename: string) =>
      import(`@/basin/ripples/${basename}.mdx`),
  },
  droplets: {
    schema: DropletFrontmatterSchema,
    // Bare `YYYY-MM-DD.mdx` droplets are valid; the date doubles as the slug.
    slugOptional: true,
    importContent: (basename: string) =>
      import(`@/basin/droplets/${basename}.mdx`),
  },
} as const;

export function sectionDir(section: SectionName): string {
  return path.join(BASIN_DIR, section);
}

type FileEntry = {
  file: string; // path relative to the section dir, POSIX sep: "2024/2024-01-08-post.mdx"
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
// allowed (loadSectionPostMeta resolves to the newest by date) but worth
// surfacing.
function warnDuplicateSlugs(section: SectionName, entries: FileEntry[]): void {
  const bySlug = new Map<string, string[]>();
  for (const e of entries) {
    const files = bySlug.get(e.slug);
    if (files) files.push(e.file);
    else bySlug.set(e.slug, [e.file]);
  }
  for (const [slug, files] of bySlug) {
    if (files.length > 1) {
      console.warn(
        `Duplicate ${section} slug "${slug}" — ${files.length} files: ${files.join(", ")}`,
      );
    }
  }
}

const _listFileEntries = cache(
  async (section: SectionName): Promise<FileEntry[]> => {
    "use cache";
    // A section with no content yet has no tracked files, so its directory may
    // not exist in a fresh clone — treat that as an empty section.
    let paths: string[];
    try {
      paths = await readdir(sectionDir(section), { recursive: true });
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code === "ENOENT") return [];
      throw e;
    }

    const entries: FileEntry[] = [];
    const invalid: { file: string; reason: string }[] = [];

    for (const rel of paths) {
      if (!rel.endsWith(".mdx")) continue;
      const classified = classifyContentPath(rel, {
        slugOptional: SECTIONS[section].slugOptional,
      });
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
        .map((e) => `  - ${BASIN_REL_PATH}/${section}/${e.file}: ${e.reason}`)
        .join("\n");
      throw new Error(`Invalid content placement:\n${list}`);
    }

    warnDuplicateSlugs(section, entries);
    return entries.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  },
);

async function parseEntry(
  section: SectionName,
  entry: FileEntry,
): Promise<PostListEntry<AnyFrontmatter>> {
  const raw = await readFile(
    path.join(sectionDir(section), entry.file),
    "utf-8",
  );
  const { attributes } = frontMatter<Record<string, unknown>>(raw);
  return {
    slug: entry.slug,
    frontmatter: (
      SECTIONS[section].schema as
        | typeof RippleFrontmatterSchema
        | typeof DropletFrontmatterSchema
    ).assert(normalizeAttributes(attributes, entry.dateStr)) as AnyFrontmatter,
  };
}

const _listAllParsed = cache(
  async (section: SectionName): Promise<PostListEntry<AnyFrontmatter>[]> => {
    "use cache";
    const entries = await _listFileEntries(section);
    const parsed = await Promise.all(
      entries.map((entry) => parseEntry(section, entry)),
    );
    return process.env.NODE_ENV === "production"
      ? parsed.filter((p) => !p.frontmatter.draft)
      : parsed;
  },
);

export type ListPostsOptions = {
  /** Slice this many posts from the start of the (filtered) list. */
  take?: number;
  /** Drop this many posts from the start before slicing. */
  skip?: number;
  /** Only include posts whose tags include this string. */
  tag?: string;
};

export async function listSectionPosts<S extends SectionName>(
  section: S,
  opts: ListPostsOptions = {},
): Promise<PostListEntry<SectionFrontmatter[S]>[]> {
  "use cache";
  const skip = opts.skip ?? 0;

  // Cheap path: no filtering, dev mode (no draft filter needed). We can slice
  // the filename list first, then parse only the N files we actually need.
  if (!opts.tag && process.env.NODE_ENV !== "production") {
    const entries = await _listFileEntries(section);
    const sliced =
      opts.take !== undefined
        ? entries.slice(skip, skip + opts.take)
        : entries.slice(skip);
    return Promise.all(
      sliced.map((entry) => parseEntry(section, entry)),
    ) as Promise<PostListEntry<SectionFrontmatter[S]>[]>;
  }

  // Expensive path: tag filter or production (drafts must be excluded). Have
  // to parse everything to apply the filter; then slice the filtered result.
  const all = opts.tag
    ? (await _listAllParsed(section)).filter((p) =>
        p.frontmatter.tags?.includes(opts.tag as string),
      )
    : await _listAllParsed(section);
  const sliced =
    opts.take !== undefined
      ? all.slice(skip, skip + opts.take)
      : all.slice(skip);
  return sliced as PostListEntry<SectionFrontmatter[S]>[];
}

export async function countSectionPosts(
  section: SectionName,
  opts: Pick<ListPostsOptions, "tag"> = {},
): Promise<number> {
  "use cache";
  // Tag filter or production: must parse to filter accurately.
  if (opts.tag || process.env.NODE_ENV === "production") {
    const all = opts.tag
      ? (await _listAllParsed(section)).filter((p) =>
          p.frontmatter.tags?.includes(opts.tag as string),
        )
      : await _listAllParsed(section);
    return all.length;
  }
  // Cheap path: count files only.
  return (await _listFileEntries(section)).length;
}

export async function listSectionTags(section: SectionName): Promise<string[]> {
  "use cache";
  const all = await _listAllParsed(section);
  const tags = new Set<string>();
  for (const p of all) {
    for (const t of p.frontmatter.tags ?? []) tags.add(t);
  }
  return Array.from(tags);
}

export type PostMeta<F = RippleFrontmatter> = {
  slug: string;
  frontmatter: F;
  basename: string;
};

export async function loadSectionPostMeta<S extends SectionName>(
  section: S,
  slug: string,
): Promise<PostMeta<SectionFrontmatter[S]> | null> {
  "use cache";
  const entries = await _listFileEntries(section);
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) return null;

  const raw = await readFile(
    path.join(sectionDir(section), entry.file),
    "utf-8",
  );
  const { attributes } = frontMatter<Record<string, unknown>>(raw);
  const frontmatter = (
    SECTIONS[section].schema as
      | typeof RippleFrontmatterSchema
      | typeof DropletFrontmatterSchema
  ).assert(
    normalizeAttributes(attributes, entry.dateStr),
  ) as SectionFrontmatter[S];
  if (process.env.NODE_ENV === "production" && frontmatter.draft) return null;
  const basename = entry.file.replace(/\.mdx$/, "");
  return { slug, frontmatter, basename };
}

const _loadSectionPost = cache(
  async (section: SectionName, slug: string): Promise<Post<AnyFrontmatter>> => {
    const meta = await loadSectionPostMeta(section, slug);
    if (!meta) notFound();
    try {
      const mod = await SECTIONS[section].importContent(meta.basename);
      return { slug, frontmatter: meta.frontmatter, Content: mod.default };
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes("Cannot find module") ||
          e.message.includes("ENOENT"))
      ) {
        // this throws
        notFound();
      }
      throw e;
    }
  },
);

export function loadSectionPost<S extends SectionName>(
  section: S,
  slug: string,
): Promise<Post<SectionFrontmatter[S]>> {
  return _loadSectionPost(section, slug) as Promise<
    Post<SectionFrontmatter[S]>
  >;
}
