import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { TZDate } from "@date-fns/tz";
import frontMatter from "front-matter";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FrontmatterSchema, type Post, type PostListEntry } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "src/content");

// All bare YAML dates (`publishedAt: 2026-05-18`) are interpreted as midnight
// in this timezone. TZDate carries its tz with it, so display methods like
// `toLocaleDateString()` format in this tz automatically — no per-site config.
export const AUTHOR_TIMEZONE = "America/New_York";

function isUtcMidnight(d: Date): boolean {
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

function normalizeAttributes(
  attrs: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...attrs };
  // Only shift bare dates (YYYY-MM-DD → UTC midnight from YAML). Explicit
  // datetimes like `2026-05-18T15:30:00Z` flow through unchanged.
  if (out.publishedAt instanceof Date && isUtcMidnight(out.publishedAt)) {
    out.publishedAt = new TZDate(
      out.publishedAt.getUTCFullYear(),
      out.publishedAt.getUTCMonth(),
      out.publishedAt.getUTCDate(),
      AUTHOR_TIMEZONE,
    );
  }
  return out;
}

export const loadPost = cache(async (slug: string): Promise<Post> => {
  try {
    const raw = await readFile(path.join(CONTENT_DIR, `${slug}.mdx`), "utf-8");
    const { attributes } = frontMatter<Record<string, unknown>>(raw);
    const frontmatter = FrontmatterSchema.assert(
      normalizeAttributes(attributes),
    );

    const mod = await import(`@/content/${slug}.mdx`);
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

export const listPosts = cache(async (): Promise<PostListEntry[]> => {
  const files = await readdir(CONTENT_DIR);

  const entries = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map(async (f) => {
        const slug = f.replace(/\.mdx?$/, "");
        const raw = await readFile(path.join(CONTENT_DIR, f), "utf-8");
        const { attributes } = frontMatter<Record<string, unknown>>(raw);
        return {
          slug,
          frontmatter: FrontmatterSchema.assert(normalizeAttributes(attributes)),
        };
      }),
  );

  const visible =
    process.env.NODE_ENV === "production"
      ? entries.filter((p) => !p.frontmatter.draft)
      : entries;

  return visible.sort(
    (a, b) =>
      b.frontmatter.publishedAt.getTime() - a.frontmatter.publishedAt.getTime(),
  );
});
