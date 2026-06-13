// import { waveCircle } from "@lucide/lab";
import {
  // Icon,
  WavesVertical,
} from "lucide-react";
import { Separator } from "@/components/atoms/separator";
import { Title } from "@/components/structure/title";
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
      <Title
        containerClassName="group flex w-auto items-center gap-2"
        className="relative -left-6 cursor-default"
        title="forming waves"
        adornment={
          <WavesVertical
            className="size-12 rounded-full bg-radial from-transparent to-amber-500/10 text-amber-900 opacity-10 shadow-amber-900/50 shadow-inner blur-[2px] transition-all duration-500 group-hover:opacity-30 group-hover:blur-none dark:text-amber-200"
            aria-hidden="true"
          />
        }
      >
        <span className="opacity-50 transition-all duration-500 group-hover:opacity-100">
          r
        </span>
        <span className="opacity-55 transition-all duration-500 group-hover:opacity-100">
          i
        </span>
        <span className="opacity-70 transition-all duration-500 group-hover:opacity-100">
          p
        </span>
        <span className="opacity-85 transition-all duration-500 group-hover:opacity-100">
          p
        </span>
        <span className="opacity-90 transition-all duration-500 group-hover:opacity-100">
          l
        </span>
        <span className="opacity-100 transition-all duration-500 group-hover:opacity-100">
          e
        </span>
        <span className="opacity-100 transition-all duration-500 group-hover:opacity-100">
          s
        </span>
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
