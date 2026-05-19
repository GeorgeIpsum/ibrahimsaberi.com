import type { Metadata } from "next";
import Link from "next/link";
import { PostListItem } from "@/services/basin/components/post-list-item";
import { listPosts } from "@/services/basin/load-post";

type Props = {
  params: Promise<{ tag: string }>;
};

// Only generate routes for tags that actually appear in at least one post.
// Stale URLs (tag that no longer exists) will render the empty state.
export async function generateStaticParams() {
  const posts = await listPosts();
  const tags = new Set<string>();
  for (const p of posts) {
    for (const t of p.frontmatter.tags ?? []) tags.add(t);
  }
  return Array.from(tags).map((tag) => ({ tag }));
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

  const allPosts = await listPosts();
  const posts = allPosts.filter((p) => p.frontmatter.tags?.includes(tag));

  return (
    <div className="mx-auto w-full sm:max-w-2xl">
      <div className="mb-8 flex items-baseline justify-between gap-3">
        <h1 className="font-heading text-3xl">
          <Link
            href="/basin"
            className="text-muted-foreground underline-offset-2 hover:underline"
          >
            basin
          </Link>{" "}
          <span className="text-muted-foreground">/</span> <span>{tag}</span>
        </h1>
        <Link
          href="/basin"
          className="text-muted-foreground text-sm underline-offset-2 hover:underline"
        >
          clear
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-muted-foreground italic">
          No posts tagged “{tag}” yet.
        </p>
      ) : (
        <section className="space-y-2">
          {posts.map((post) => (
            <PostListItem key={post.slug} post={post} />
          ))}
        </section>
      )}
    </div>
  );
}
