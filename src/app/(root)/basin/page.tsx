import { DropList } from "@/components/drops";
import { api } from "@/trpc/server";

export default async function Page() {
  const posts = await api.drops.allPosts.query();
  return (
    <div className="mx-auto w-full sm:w-[600px] md:w-[688px] lg:w-full">
      <DropList drops={posts} />
    </div>
  );
}
