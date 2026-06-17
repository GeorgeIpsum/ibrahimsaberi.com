import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/atoms/badge";
import { InlineMarkdown } from "@/components/structure/inline-markdown";
import {
  AUTHOR_TIMEZONE,
  listPosts,
  loadDrop,
  loadDropMeta,
} from "@/services/basin/load-post";
import { BasinEntranceScript } from "./basin-entrance-script";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts
    .filter(
      (post) =>
        process.env.NODE_ENV !== "production" || !post.frontmatter.draft,
    )
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = await loadDropMeta(slug);
  if (!meta) notFound();
  return {
    title: meta.frontmatter.title,
    description: meta.frontmatter.blurb,
  };
}

// The MDX import is the slow await — isolated behind Suspense so the header
// renders from cached metadata immediately, before the body resolves.
async function PostBody({ slug }: { slug: string }) {
  const { Content, frontmatter } = await loadDrop(slug);
  return (
    <div className="entrance-fade-up prose max-w-none">
      {frontmatter.tags?.includes("migrated") && (
        <blockquote>
          This post was migrated from my original Jekyll site with little to no
          modification. Weird formatting (and general prose cringe) is to be
          expected.
          <br />
          <s>Sorry.</s>
        </blockquote>
      )}
      <Content />
    </div>
  );
}

export default async function BasinPostPage({ params }: Props) {
  const { slug } = await params;
  const meta = await loadDropMeta(slug);
  if (!meta) notFound();
  const { frontmatter } = meta;

  return (
    <div className="basin-entrance" suppressHydrationWarning>
      <BasinEntranceScript />
      <header className="mb-8 border-border border-b pb-6">
        <h1 className="water-title text-4xl leading-tight tracking-tight">
          <span>{frontmatter.title}</span>
          <span className="water-title-fill" aria-hidden="true">
            {frontmatter.title}
          </span>
        </h1>
        <div className="mt-4 flex items-center gap-4 text-muted-foreground text-sm">
          <time className="entrance-fade" dateTime={frontmatter.publishedAt}>
            {new Date(frontmatter.publishedAt).toLocaleDateString("en-US", {
              timeZone: AUTHOR_TIMEZONE,
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {frontmatter.tags?.length ? (
            <ul className="flex max-w-full flex-wrap items-baseline gap-1">
              {frontmatter.tags.map((tag, index) => (
                <li
                  key={tag}
                  className="entrance-fade"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Badge
                    render={
                      <Link href={`/basin/tags/${encodeURIComponent(tag)}`} />
                    }
                  >
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {frontmatter.blurb ? (
          <p className="entrance-fade-up mt-4 text-lg text-muted-foreground italic">
            <InlineMarkdown>{frontmatter.blurb}</InlineMarkdown>
          </p>
        ) : null}
      </header>

      <Suspense>
        <PostBody slug={slug} />
      </Suspense>
    </div>
  );
}
