import { HFNotFound } from "@/components/navigation/hf-not-found";

export default function PostNotFound() {
  return (
    <HFNotFound className="h-[calc(100svh-14rem)] md:h-[calc(100svh-18rem)]">
      <div className="flex flex-col gap-4">
        <div>There is no post here.</div>
        <div className="font-bold text-foreground-high-contrast">
          There was never a post here.
        </div>
      </div>
    </HFNotFound>
  );
}
