import { ScrollArea } from "@/components/atoms/scroll-area";
import { Pasta } from "@/features/pasta";
import { PastaOptions } from "@/features/pasta/components/options";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ noodle?: string }>;
}) {
  return (
    <>
      <h1>pasta tiem</h1>
      <PastaOptions />
      <div className="relative my-4 flex h-[calc(100svh-18rem)] w-full rounded-2xl border border-border bg-card p-4">
        <ScrollArea>
          <Pasta searchParams={searchParams} />
        </ScrollArea>
      </div>
    </>
  );
}
