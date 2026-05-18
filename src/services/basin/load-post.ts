import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import frontMatter from "front-matter";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FrontmatterSchema, type Post, type PostListEntry } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "src/content");

export const loadPost = cache(async (slug: string): Promise<Post> => {
  try {
    const raw = await readFile(path.join(CONTENT_DIR, `${slug}.mdx`), "utf-8");
    const { attributes } = frontMatter<Record<string, unknown>>(raw);
    const frontmatter = FrontmatterSchema.assert(attributes);

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
        return { slug, frontmatter: FrontmatterSchema.assert(attributes) };
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
