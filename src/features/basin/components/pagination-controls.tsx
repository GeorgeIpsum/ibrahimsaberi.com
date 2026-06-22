"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";
import { cn } from "@/css/lib";
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
    <Pagination className="pt-4">
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
              const after = tokens[index + 1];
              const hiddenPages =
                typeof before === "number" && typeof after === "number"
                  ? Array.from(
                      { length: Math.max(0, after - before - 1) },
                      (_, i) => before + i + 1,
                    )
                  : [];

              return (
                <HiddenPagesPopover
                  key={`gap-${typeof before === "number" ? before : "start"}`}
                  hiddenPages={hiddenPages}
                  basePath={basePath}
                />
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

const HIDDEN_PAGES_PAGE_SIZE = 3;

function HiddenPagesPopover({
  hiddenPages,
  basePath,
}: {
  hiddenPages: number[];
  basePath: string;
}) {
  const [startIndex, setStartIndex] = useState(0);
  const maxStartIndex = Math.max(
    0,
    hiddenPages.length - HIDDEN_PAGES_PAGE_SIZE,
  );
  const visiblePages = hiddenPages.slice(
    startIndex,
    startIndex + HIDDEN_PAGES_PAGE_SIZE,
  );
  const canPageUp = startIndex > 0;
  const canPageDown = startIndex < maxStartIndex;

  // biome-ignore lint/correctness/useExhaustiveDependencies: required
  useEffect(() => {
    setStartIndex(0);
  }, [hiddenPages]);

  return (
    <PaginationItem>
      <Popover>
        <PopoverTrigger
          className={buttonVariants({
            size: "icon",
            variant: "ghost",
          })}
        >
          <PaginationEllipsis />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          popoverProps={{ className: "p-1!" }}
        >
          <PaginationContent className="flex-col">
            {hiddenPages.length > HIDDEN_PAGES_PAGE_SIZE ? (
              <PaginationItem>
                <button
                  type="button"
                  aria-label="Show previous hidden pages"
                  disabled={!canPageUp}
                  onClick={() =>
                    setStartIndex((current) =>
                      Math.max(0, current - HIDDEN_PAGES_PAGE_SIZE),
                    )
                  }
                  className={buttonVariants({
                    size: "icon",
                    variant: "ghost",
                  })}
                >
                  <span aria-hidden="true">⌃</span>
                </button>
              </PaginationItem>
            ) : null}

            {visiblePages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  aria-label={`Go to page ${pageNumber}`}
                  className={buttonVariants({
                    size: "icon",
                    variant: "ghost",
                  })}
                  isActive={false}
                  render={<Link href={pageHref(pageNumber, basePath)} />}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {hiddenPages.length > HIDDEN_PAGES_PAGE_SIZE ? (
              <PaginationItem>
                <button
                  type="button"
                  aria-label="Show next hidden pages"
                  disabled={!canPageDown}
                  onClick={() =>
                    setStartIndex((current) =>
                      Math.min(maxStartIndex, current + HIDDEN_PAGES_PAGE_SIZE),
                    )
                  }
                  className={buttonVariants({
                    size: "icon",
                    variant: "ghost",
                  })}
                >
                  <span aria-hidden="true">⌄</span>
                </button>
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </PopoverContent>
      </Popover>
    </PaginationItem>
  );
}

const NavLink: React.FC<
  React.ComponentProps<typeof PaginationLink> & { href: string }
> = ({ href, children, ...props }) => {
  // add a mb-1 to the internal span to deal with weird font baseline nonsense when using lowercased text
  return (
    <Link
      {...props}
      href={href}
      className={cn(
        props.className,
        "flex h-6 items-center gap-1 font-heading text-sm lowercase [&>span]:mb-1",
      )}
    >
      {children}
    </Link>
  );
};
