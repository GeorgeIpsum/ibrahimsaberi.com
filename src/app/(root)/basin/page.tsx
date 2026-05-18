import Link from "next/link";
import { listPosts } from "@/services/basin/load-post";

export default async function BasinIndex() {
  const posts = await listPosts();

  return (
    <div className="mx-auto w-full sm:max-w-2xl">
      <h1 className="mb-8 font-heading text-3xl">basin</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground italic">Nothing yet.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.slug}>
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
                  <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                    {post.frontmatter.blurb}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
