import { Scroll } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";
import { Badge } from "@/components/atoms/badge";
import { InlineMarkdown } from "@/components/structure/inline-markdown";
import { AUTHOR_TIMEZONE } from "../load-post";
import type { PostListEntry } from "../types";

interface PostListItemProps {
  post: PostListEntry;
}
export const PostListItem: React.FC<PostListItemProps> = ({ post }) => {
  const isMigrated = post.frontmatter.tags?.includes("migrated");

  return (
    <article key={post.slug}>
      <Link
        href={`/basin/${post.slug}`}
        className="group block rounded-lg p-3 transition-colors hover:bg-accent/40"
        transitionTypes={["nav-forward"]}
      >
        <div className="flex min-h-12 items-baseline justify-between gap-3">
          <ViewTransition name={`droplet-${post.slug}`}>
            <h2 className="font-heading text-foreground text-xl transition-colors group-hover:text-foreground-high-contrast">
              {post.frontmatter.title}
            </h2>
          </ViewTransition>
          <div className="flex flex-col items-end justify-end gap-1">
            <time
              dateTime={post.frontmatter.publishedAt}
              className="shrink-0 text-muted-foreground text-xs"
            >
              {new Date(post.frontmatter.publishedAt).toLocaleDateString(
                "en-US",
                {
                  timeZone: AUTHOR_TIMEZONE,
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              )}
            </time>
            <div className="flex max-w-24 flex-wrap items-center justify-end gap-2 sm:max-w-48">
              {post.frontmatter.draft && (
                <Badge variant="info" size="sm">
                  <Scroll
                    style={{ transform: "scaleX(-1)" }}
                    aria-hidden="true"
                  />
                  DRAFT
                </Badge>
              )}
              {isMigrated && (
                <Badge variant="outline" size="sm">
                  MIGRATED
                </Badge>
              )}
            </div>
          </div>
        </div>
        {post.frontmatter.blurb ? (
          <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
            <InlineMarkdown>{post.frontmatter.blurb}</InlineMarkdown>
          </p>
        ) : null}
      </Link>
    </article>
  );
};
