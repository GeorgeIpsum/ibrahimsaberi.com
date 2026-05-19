import { PostListItem } from "@/services/basin/components/post-list-item";
import { listPosts } from "@/services/basin/load-post";

export default async function BasinIndex() {
  const posts = await listPosts();

  return (
    <div className="mx-auto w-full sm:max-w-2xl">
      <h1 className="mb-8 font-heading text-3xl">basin</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground italic">Nothing yet.</p>
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
