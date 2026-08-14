import Link from "next/link";
import { loadDroplet } from "../droplets";
import { AUTHOR_TIMEZONE } from "../load-section";
import type { DropletFrontmatter, PostListEntry } from "../types";
import { PostTags } from "./post-tag";

interface DropletStreamItemProps {
  droplet: PostListEntry<DropletFrontmatter>;
}

export async function DropletStreamItem({ droplet }: DropletStreamItemProps) {
  const { Content, frontmatter } = await loadDroplet(droplet.slug);

  const publishDate = new Date(frontmatter.publishedAt);

  return (
    <article className="rounded-lg p-3">
      <header className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-primary text-xl">
          {frontmatter.title ??
            publishDate.toLocaleDateString("en-US", {
              timeZone: AUTHOR_TIMEZONE,
              year: "numeric",
              month: "long",
              day: "2-digit",
            })}
        </h2>
        <div className="ml-auto flex flex-col items-end gap-1">
          <Link
            href={`/basin/droplets/${droplet.slug}`}
            className="shrink-0 text-muted-foreground text-xs underline-offset-2 hover:underline"
          >
            <time dateTime={frontmatter.publishedAt}>
              {publishDate.toLocaleDateString("en-US", {
                timeZone: AUTHOR_TIMEZONE,
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </Link>
          <PostTags
            tags={[
              ...(frontmatter.tags ?? []),
              ...(frontmatter.draft ? ["draft"] : []),
            ]}
          />
        </div>
      </header>
      <div className="prose max-w-none">
        <Content />
      </div>
    </article>
  );
}
