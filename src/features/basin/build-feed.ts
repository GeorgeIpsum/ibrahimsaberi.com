import "server-only";
import { Feed } from "feed";
import type { headers as nextHeaders } from "next/headers";
import { listRipples } from "./ripples";

const FALLBACK_HOST = "ibrahimsaberi.com";
const SITE_TITLE = "Don't Drown";
const SITE_DESCRIPTION = "the basin continues to overflow. can you stand?";
const AUTHOR_NAME = "Ibrahim Saberi";
const COPYRIGHT =
  "content developed, owned, and published by Studio HMR. All rights reserved.";

type Headers = Awaited<ReturnType<typeof nextHeaders>>;

export function originFromHeaders(h: Headers): string {
  const host = h.get("host") ?? FALLBACK_HOST;
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function buildFeed(origin: string): Promise<Feed> {
  const feed = new Feed({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    id: `${origin}/`,
    link: origin,
    language: "en-US",
    favicon: `${origin}/favicon.ico`,
    copyright: COPYRIGHT,
    updated: new Date(),
    generator: "paper g1n",
    feedLinks: {
      rss: `${origin}/feed.xml`,
      atom: `${origin}/atom.xml`,
      json: `${origin}/feed.json`,
    },
    author: {
      name: AUTHOR_NAME,
      link: origin,
    },
  });

  const posts = await listRipples();
  for (const post of posts) {
    if (post.frontmatter.draft) continue;

    const url = `${origin}/basin/${post.slug}`;
    feed.addItem({
      title: post.frontmatter.title,
      id: url,
      link: url,
      description: post.frontmatter.blurb ?? "",
      date: new Date(post.frontmatter.publishedAt),
      author: [{ name: AUTHOR_NAME, link: origin }],
      category: (post.frontmatter.tags ?? []).map((name) => ({ name })),
    });
  }

  return feed;
}
