import Link from "next/link";
import { listPosts } from "@/features/basin/load-post";

export default async function Page() {
  const posts = await listPosts();

  const tags = posts.reduce(
    (acc, prev) => {
      // only count tags from non-draft posts in production
      if (process.env.NODE_ENV !== "production" || !prev.frontmatter.draft) {
        prev.frontmatter.tags?.forEach((tag) => {
          const existing = acc.find(([t]) => t === tag);
          if (existing) {
            existing[1]++;
          } else {
            acc.push([tag, 1]);
          }
        });
      }
      return acc;
    },
    [] as [string, number][],
  );

  tags.sort((a, b) => {
    const desc = b[1] - a[1];
    if (desc !== 0) return desc;
    return a[0].localeCompare(b[0]);
  });

  return (
    <>
      <h1 className="text-3xl">tags</h1>
      <div className="my-8 w-full">
        {tags.length === 0 ? (
          <p className="text-muted-foreground italic">Nothing yet.</p>
        ) : (
          <div className="flex h-full w-full flex-wrap items-baseline justify-start space-x-6 space-y-4 align-baseline">
            {tags.map(([tag, count]) => (
              <Link
                key={tag}
                href={`/basin/tags/${tag}`}
                className="group flex items-center gap-2"
              >
                <span className="font-medium group-hover:text-foreground-high-contrast">
                  {tag}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs tabular-nums transition-colors group-hover:bg-foreground group-hover:text-background">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
