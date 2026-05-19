import Link from "next/link";
import { InlineMarkdown } from "@/components/inline-markdown";
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
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-xl transition-colors group-hover:text-primary">
            {post.frontmatter.title}
          </h2>
          <time
            dateTime={post.frontmatter.publishedAt.toISOString()}
            className="shrink-0 text-muted-foreground text-xs"
          >
            {post.frontmatter.publishedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        </div>
        {post.frontmatter.blurb ? (
          <>
            {isMigrated && (
              <p className="font-black font-mono text-muted-foreground text-xs uppercase">
                A Migrated Post
              </p>
            )}
            <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
              <InlineMarkdown>{post.frontmatter.blurb}</InlineMarkdown>
            </p>
          </>
        ) : null}
      </Link>
    </article>
  );
};
