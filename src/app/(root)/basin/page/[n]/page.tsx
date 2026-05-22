import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Separator } from "@/components/atoms/separator";
import { PaginationControls } from "@/services/basin/components/pagination-controls";
import { PostListItem } from "@/services/basin/components/post-list-item";
import { countPosts, listPosts } from "@/services/basin/load-post";
import { makePageInfo, POSTS_PER_PAGE } from "@/services/basin/pagination";

type Props = {
  params: Promise<{ n: string }>;
};

export async function generateStaticParams() {
  const total = await countPosts();
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  // Page 1 lives at /basin; generate /basin/page/2, /basin/page/3, …
  const params = Array.from({ length: totalPages - 1 }, (_, i) => ({
    n: String(i + 2),
  }));

  // Cache Components requires at least one entry. If there's nothing to
  // paginate, return a sentinel that the page below will notFound() on.
  return params.length > 0 ? params : [{ n: "2" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return {
    title: `basin · page ${n}`,
  };
}

export default async function BasinPaginatedIndex({ params }: Props) {
  const { n } = await params;
  const pageNumber = Number(n);

  // /basin/page/1 is not canonical (page 1 lives at /basin) — 404 it to keep
  // one URL per page. Also reject non-integers and anything < 2.
  if (!Number.isInteger(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const total = await countPosts();
  const page = makePageInfo(pageNumber, total);
  if (page.pageNumber !== pageNumber) {
    // Requested page is beyond what exists.
    notFound();
  }

  const posts = await listPosts({
    skip: (pageNumber - 1) * POSTS_PER_PAGE,
    take: POSTS_PER_PAGE,
  });

  return (
    <>
      <h1 className="mb-8 font-heading text-3xl">basin</h1>
      <section className="space-y-2">
        {posts.map((post) => (
          <PostListItem key={post.slug} post={post} />
        ))}
      </section>
      <Separator className="-mx-2 mt-8 data-[orientation=horizontal]:w-[calc(100%+1rem)] md:-mx-4 md:data-[orientation=horizontal]:w-[calc(100%+2rem)]" />
      <PaginationControls page={page} />
    </>
  );
}
