"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/atoms/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/atoms/pagination";
import {
  nextHref,
  type PageInfo,
  pageHref,
  pageWindow,
  prevHref,
} from "../pagination";

interface PaginationControlsProps {
  page: PageInfo;
  /** URL prefix for page links. Defaults to /basin. */
  basePath?: string;
}
export function PaginationControls({
  page,
  basePath = "/basin",
}: PaginationControlsProps) {
  if (page.totalPages <= 1) return null;

  const tokens = pageWindow(page.pageNumber, page.totalPages);

  return (
    <Pagination className="mt-8 border-border border-t pt-4">
      <PaginationContent className="w-full justify-between">
        <PaginationItem>
          <PaginationPrevious
            disabled={!page.hasPrev}
            text="newer"
            aria-label="Go to newer posts"
            iconClassName="size-4"
            render={<NavLink href={prevHref(page.pageNumber, basePath)} />}
          />
        </PaginationItem>

        <div className="flex items-center justify-center gap-1 justify-self-center">
          {tokens.map((token, index) => {
            if (token === "ellipsis") {
              const before = tokens[index - 1];
              return (
                <PaginationItem
                  key={`gap-${typeof before === "number" ? before : "start"}`}
                >
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            const isActive = token === page.pageNumber;
            return (
              <PaginationItem key={token}>
                <PaginationLink
                  aria-label={`Go to page ${token}`}
                  className={buttonVariants({
                    size: "icon",
                    variant: isActive ? "outline" : "ghost",
                  })}
                  isActive={isActive}
                  render={<Link href={pageHref(token, basePath)} />}
                >
                  {token}
                </PaginationLink>
              </PaginationItem>
            );
          })}
        </div>

        <PaginationItem>
          <PaginationNext
            disabled={!page.hasNext}
            text="older"
            aria-label="Go to older posts"
            iconClassName="size-4"
            render={<NavLink href={nextHref(page.pageNumber, basePath)} />}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

const NavLink: React.FC<React.PropsWithChildren<{ href: string }>> = ({
  href,
  children,
}) => {
  // add a mb-1 to the internal span to deal with weird font baseline nonsense when using lowercased text
  return (
    <Link
      href={href}
      className="flex h-6 items-center gap-1 font-heading text-sm lowercase [&>span]:mb-1"
    >
      {children}
    </Link>
  );
};
