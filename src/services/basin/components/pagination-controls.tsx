import Link from "next/link";
import { nextHref, type PageInfo, prevHref } from "../pagination";

interface Props {
  page: PageInfo;
  /** URL prefix for prev/next links. Defaults to /basin. */
  basePath?: string;
}

export function PaginationControls({ page, basePath = "/basin" }: Props) {
  if (page.totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-between border-border border-t pt-4 text-sm">
      {page.hasPrev ? (
        <Link
          href={prevHref(page.pageNumber, basePath)}
          className="w-16 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          ← Newer
        </Link>
      ) : (
        <span className="w-16" />
      )}
      <span className="text-muted-foreground text-xs">
        {page.pageNumber} / {page.totalPages}
      </span>
      {page.hasNext ? (
        <Link
          href={nextHref(page.pageNumber, basePath)}
          className="w-16 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Older →
        </Link>
      ) : (
        <span className="w-16" />
      )}
    </nav>
  );
}
