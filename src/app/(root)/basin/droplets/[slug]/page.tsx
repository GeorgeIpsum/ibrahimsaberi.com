import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/atoms/badge";
import {
  listDroplets,
  loadDroplet,
  loadDropletMeta,
} from "@/features/basin/droplets";
import { AUTHOR_TIMEZONE } from "@/features/basin/load-section";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDropletDate(publishedAt: string): string {
  return new Date(publishedAt).toLocaleDateString("en-US", {
    timeZone: AUTHOR_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  const droplets = await listDroplets();
  // Cache Components requires at least one entry. If no droplets exist yet,
  // return a sentinel that the page below will notFound() on.
  return droplets.length > 0
    ? droplets.map((d) => ({ slug: d.slug }))
    : [{ slug: "_" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = await loadDropletMeta(slug);
  if (!meta) notFound();
  return {
    title:
      meta.frontmatter.title ??
      `droplet · ${formatDropletDate(meta.frontmatter.publishedAt)}`,
  };
}

// The MDX import is the slow await — isolated behind Suspense so the header
// renders from cached metadata immediately, before the body resolves.
async function DropletBody({ slug }: { slug: string }) {
  const { Content } = await loadDroplet(slug);
  return (
    <div className="prose max-w-none">
      <Content />
    </div>
  );
}

export default async function DropletPage({ params }: Props) {
  const { slug } = await params;
  const meta = await loadDropletMeta(slug);
  if (!meta) notFound();
  const { frontmatter } = meta;

  return (
    <>
      <header className="mb-8 border-border border-b pb-6">
        <h1 className="text-3xl leading-tight tracking-tight">
          {frontmatter.title ?? formatDropletDate(frontmatter.publishedAt)}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-muted-foreground text-sm">
          <time dateTime={frontmatter.publishedAt}>
            {formatDropletDate(frontmatter.publishedAt)}
          </time>
          {frontmatter.tags?.length ? (
            <ul className="flex max-w-full flex-wrap items-baseline gap-1">
              {frontmatter.tags.map((tag) => (
                <li key={tag}>
                  <Badge>{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <Suspense>
        <DropletBody slug={slug} />
      </Suspense>
    </>
  );
}
