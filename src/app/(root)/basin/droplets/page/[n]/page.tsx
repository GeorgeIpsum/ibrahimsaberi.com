import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Separator } from "@/components/atoms/separator";
import { DropletStreamItem } from "@/features/basin/components/droplet-stream-item";
import { PaginationControls } from "@/features/basin/components/pagination-controls";
import { countDroplets, listDroplets } from "@/features/basin/droplets";
import { DROPLETS_PER_PAGE, makePageInfo } from "@/features/basin/pagination";

type Props = {
  params: Promise<{ n: string }>;
};

export async function generateStaticParams() {
  const total = await countDroplets();
  const totalPages = Math.max(1, Math.ceil(total / DROPLETS_PER_PAGE));
  // Page 1 lives at /basin/droplets; generate /basin/droplets/page/2, …
  const params = Array.from({ length: totalPages - 1 }, (_, i) => ({
    n: String(i + 2),
  }));

  // Cache Components requires at least one entry. If there's nothing to
  // paginate, return a sentinel that the page below will notFound() on.
  return params.length > 0 ? params : [{ n: "2" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return {
    title: `droplets · page ${n}`,
  };
}

export default async function DropletsPaginatedIndex({ params }: Props) {
  const { n } = await params;
  const pageNumber = Number(n);

  // /basin/droplets/page/1 is not canonical (page 1 lives at /basin/droplets)
  // — 404 it to keep one URL per page. Also reject non-integers and < 2.
  if (!Number.isInteger(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const total = await countDroplets();
  const page = makePageInfo(pageNumber, total, DROPLETS_PER_PAGE);
  if (page.pageNumber !== pageNumber) {
    // Requested page is beyond what exists.
    notFound();
  }

  const droplets = await listDroplets({
    skip: (pageNumber - 1) * DROPLETS_PER_PAGE,
    take: DROPLETS_PER_PAGE,
  });

  return (
    <>
      <h1 className="mb-8 font-heading text-3xl">droplets</h1>
      <section className="space-y-6">
        {droplets.map((droplet) => (
          <DropletStreamItem key={droplet.slug} droplet={droplet} />
        ))}
      </section>
      <Separator className="-mx-2 mt-8 data-[orientation=horizontal]:w-[calc(100%+1rem)] md:-mx-4 md:data-[orientation=horizontal]:w-[calc(100%+2rem)]" />
      <PaginationControls page={page} basePath="/basin/droplets" />
    </>
  );
}
