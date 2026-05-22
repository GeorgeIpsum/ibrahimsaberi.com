import { Separator } from "@/components/atoms/separator";
import { PaginationControls } from "@/services/basin/components/pagination-controls";
import { PostListItem } from "@/services/basin/components/post-list-item";
import { countPosts, listPosts } from "@/services/basin/load-post";
import { makePageInfo, POSTS_PER_PAGE } from "@/services/basin/pagination";

export default async function BasinIndex() {
  const [posts, total] = await Promise.all([
    listPosts({ take: POSTS_PER_PAGE }),
    countPosts(),
  ]);
  const page = makePageInfo(1, total);

  return (
    <>
      <h1 className="mb-8 text-3xl">basin</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground italic">Nothing yet.</p>
      ) : (
        <>
          <section className="space-y-2">
            {posts.map((post) => (
              <PostListItem key={post.slug} post={post} />
            ))}
          </section>
          <Separator className="-mx-2 mt-8 data-[orientation=horizontal]:w-[calc(100%+1rem)] md:-mx-4 md:data-[orientation=horizontal]:w-[calc(100%+2rem)]" />
          <PaginationControls page={page} />
        </>
      )}
    </>
  );
}
