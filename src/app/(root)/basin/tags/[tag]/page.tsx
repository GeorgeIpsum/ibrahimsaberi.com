import type { Metadata } from "next";
import Link from "next/link";
import { PaginationControls } from "@/features/basin/components/pagination-controls";
import { PostListItem } from "@/features/basin/components/post-list-item";
import { makePageInfo, POSTS_PER_PAGE } from "@/features/basin/pagination";
import {
  countRipples,
  listRipples,
  listRippleTags,
} from "@/features/basin/ripples";

type Props = {
  params: Promise<{ tag: string }>;
};

// Only generate routes for tags that actually appear in at least one post.
export async function generateStaticParams() {
  const tags = await listRippleTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `basin · ${decoded}`,
    description: `Posts tagged "${decoded}".`,
  };
}

export default async function TaggedBasinIndex({ params }: Props) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);

  const [posts, total] = await Promise.all([
    listRipples({ tag, take: POSTS_PER_PAGE }),
    countRipples({ tag }),
  ]);
  const page = makePageInfo(1, total);

  return (
    <div className="mx-auto w-full sm:max-w-2xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="flex-1 font-heading text-3xl">
          <Link
            href="/basin"
            className="text-muted-foreground underline-offset-2 hover:underline"
          >
            basin
          </Link>{" "}
          <span className="text-muted-foreground">/</span> <span>{tag}</span>
        </h1>
        <div className="flex flex-col items-end justify-center">
          <Link
            href="/basin/tags"
            className="text-muted-foreground text-sm underline-offset-2 hover:underline"
          >
            view all
          </Link>
          <Link
            href="/basin"
            className="text-muted-foreground text-sm underline-offset-2 hover:underline"
          >
            clear
          </Link>
        </div>
      </div>
      {posts.length === 0 ? (
        <p className="text-muted-foreground italic">
          No posts tagged “{tag}” yet.
        </p>
      ) : (
        <>
          <section className="space-y-2">
            {posts.map((post) => (
              <PostListItem key={post.slug} post={post} />
            ))}
          </section>
          <PaginationControls
            page={page}
            basePath={`/basin/tags/${encodeURIComponent(tag)}`}
          />
        </>
      )}
    </div>
  );
}
