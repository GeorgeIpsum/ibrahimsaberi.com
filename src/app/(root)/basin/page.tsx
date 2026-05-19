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
    <div className="mx-auto w-full sm:max-w-2xl">
      <h1 className="mb-8 font-heading text-3xl">basin</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground italic">Nothing yet.</p>
      ) : (
        <>
          <section className="space-y-2">
            {posts.map((post) => (
              <PostListItem key={post.slug} post={post} />
            ))}
          </section>
          <PaginationControls page={page} />
        </>
      )}
    </div>
  );
}
