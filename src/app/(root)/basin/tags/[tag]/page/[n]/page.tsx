import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginationControls } from "@/features/basin/components/pagination-controls";
import { PostListItem } from "@/features/basin/components/post-list-item";
import { countRipples, listRipples, listRippleTags } from "@/features/basin/ripples";
import { makePageInfo, POSTS_PER_PAGE } from "@/features/basin/pagination";

type Props = {
  params: Promise<{ tag: string; n: string }>;
};

export async function generateStaticParams() {
  const tags = await listRippleTags();
  const params: { tag: string; n: string }[] = [];
  for (const tag of tags) {
    const total = await countRipples({ tag });
    const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
    // Page 1 lives at /basin/tags/<tag>; emit 2…totalPages.
    for (let i = 2; i <= totalPages; i++) {
      params.push({ tag, n: String(i) });
    }
  }

  // Cache Components requires at least one entry. Fall back to a sentinel
  // (using the first known tag if any) that the page below will notFound() on.
  if (params.length === 0) {
    params.push({ tag: tags[0] ?? "_", n: "2" });
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag, n } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `basin · ${decoded} · page ${n}`,
    description: `Posts tagged "${decoded}", page ${n}.`,
  };
}

export default async function TaggedBasinPaginatedIndex({ params }: Props) {
  const { tag: rawTag, n } = await params;
  const tag = decodeURIComponent(rawTag);
  const pageNumber = Number(n);

  // Page 1 is canonical at /basin/tags/<tag>; reject /page/1, non-integers, <2.
  if (!Number.isInteger(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const total = await countRipples({ tag });
  const page = makePageInfo(pageNumber, total);
  if (page.pageNumber !== pageNumber) {
    notFound();
  }

  const posts = await listRipples({
    tag,
    skip: (pageNumber - 1) * POSTS_PER_PAGE,
    take: POSTS_PER_PAGE,
  });

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
          <span className="text-muted-foreground">/</span>{" "}
          <Link
            href={`/basin/tags/${encodeURIComponent(tag)}`}
            className="text-muted-foreground underline-offset-2 hover:underline"
          >
            {tag}
          </Link>
        </h1>
        <Link
          href="/basin"
          className="text-muted-foreground text-sm underline-offset-2 hover:underline"
        >
          clear
        </Link>
      </div>
      <section className="space-y-2">
        {posts.map((post) => (
          <PostListItem key={post.slug} post={post} />
        ))}
      </section>
      <PaginationControls
        page={page}
        basePath={`/basin/tags/${encodeURIComponent(tag)}`}
      />
    </div>
  );
}
