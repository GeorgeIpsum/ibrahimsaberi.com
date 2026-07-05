import Link from "next/link";
import { InlineMarkdown } from "@/components/structure/inline-markdown";
import { cn } from "@/css/lib";
import { AUTHOR_TIMEZONE } from "../load-section";
import type { PostListEntry } from "../types";
import { PostTags } from "./post-tag";

// If I don't deploy more than once a month then the website deserves to be forcibly broken.
// Get good
const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

interface PostListItemProps {
  post: PostListEntry;
}
export const PostListItem: React.FC<PostListItemProps> = ({ post }) => {
  const isNewPost =
    new Date(post.frontmatter.publishedAt) > new Date(oneMonthAgo);

  return (
    <article key={post.slug}>
      <Link
        href={`/basin/${post.slug}`}
        title={post.frontmatter.linkTitle ?? post.frontmatter.title}
        className="group block rounded-lg p-3 transition-colors hover:bg-secondary/5"
      >
        <div className="flex min-h-12 items-baseline justify-between gap-3">
          <h2
            className={cn(
              "flex items-center gap-2 font-heading text-xl transition-colors group-hover:text-foreground-high-contrast",
              isNewPost ? "text-foreground-high-contrast" : "text-primary",
            )}
          >
            {post.frontmatter.title}
          </h2>
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
            <PostTags
              tags={[
                ...(post.frontmatter.tags ?? []),
                ...(post.frontmatter.draft ? ["draft"] : []),
                ...(isNewPost ? ["new"] : []),
              ]}
            />
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
