// import { waveCircle } from "@lucide/lab";

import type { Metadata } from "next";
import { Separator } from "@/components/atoms/separator";
import { Title } from "@/components/structure/title";
import { PaginationControls } from "@/features/basin/components/pagination-controls";
import { PostListItem } from "@/features/basin/components/post-list-item";
import { makePageInfo, POSTS_PER_PAGE } from "@/features/basin/pagination";
import { countRipples, listRipples } from "@/features/basin/ripples";
import { ASCII_WAVE } from "@/utils/ascii";

export default async function BasinIndex() {
  const [posts, total] = await Promise.all([
    listRipples({ take: POSTS_PER_PAGE }),
    countRipples(),
  ]);
  const page = makePageInfo(1, total);

  return (
    <>
      <Title
        containerClassName="group flex w-auto items-center gap-2"
        title="forming waves"
        art={{
          ascii: ASCII_WAVE,
          anchor: "top-left",
          offset: { x: 0, y: -3 },
          opacity: { start: 1, end: 0.1, direction: "left-to-right" },
        }}
      >
        ripples
      </Title>

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

export const metadata: Metadata = {
  title: "ripples",
  description:
    "the basin overflows. a collection of thoughts, ideas, and reflections.",
};
