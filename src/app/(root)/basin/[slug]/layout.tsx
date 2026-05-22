import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import { Badge } from "@/components/atoms/badge";
import { InlineMarkdown } from "@/components/structure/inline-markdown";
import { AUTHOR_TIMEZONE, loadPostMeta } from "@/services/basin/load-post";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function BasinPostLayout({ children, params }: Props) {
  const { slug } = await params;
  const { frontmatter } = await loadPostMeta(slug);

  return (
    <article className="rounded-lg px-4 pt-4 pb-14 shadow-lg backdrop-blur-lg md:px-6 md:pt-12 md:pb-20">
      <header className="mb-8 border-border border-b pb-6">
        <ViewTransition
          name={`droplet-${slug}`}
          share="droplet-title"
          enter="droplet-title"
          default="none"
        >
          <h1 className="font-heading text-4xl leading-tight tracking-tight">
            {frontmatter.title}
          </h1>
        </ViewTransition>
        <ViewTransition default="none" enter="droplet-settle">
          <div className="mt-4 flex items-center gap-4 text-muted-foreground text-sm">
            <time dateTime={frontmatter.publishedAt}>
              {new Date(frontmatter.publishedAt).toLocaleDateString("en-US", {
                timeZone: AUTHOR_TIMEZONE,
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {frontmatter.tags?.length ? (
              <ul className="flex max-w-full flex-wrap items-baseline gap-1">
                {frontmatter.tags.map((tag) => (
                  <li key={tag}>
                    <Badge
                      // variant="outline"
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
            <p className="mt-4 text-lg text-muted-foreground italic">
              <InlineMarkdown>{frontmatter.blurb}</InlineMarkdown>
            </p>
          ) : null}
        </ViewTransition>
      </header>

      <ViewTransition default="none" enter="droplet-settle">
        <div className="prose max-w-none">{children}</div>
      </ViewTransition>
    </article>
  );
}
