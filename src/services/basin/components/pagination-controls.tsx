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

interface Props {
  page: PageInfo;
  /** URL prefix for page links. Defaults to /basin. */
  basePath?: string;
}

export function PaginationControls({ page, basePath = "/basin" }: Props) {
  if (page.totalPages <= 1) return null;

  const tokens = pageWindow(page.pageNumber, page.totalPages);

  return (
    <Pagination className="mt-8 border-border border-t pt-4">
      <PaginationContent className="w-full justify-between">
        <PaginationItem>
          {/* <NavLink
            disabled={!page.hasPrev}
            href={prevHref(page.pageNumber, basePath)}
            label="Go to newer posts"
          >
            <ChevronLeftIcon />
            Newer
          </NavLink> */}
          <PaginationPrevious
            disabled={!page.hasPrev}
            text="newer"
            aria-label="Go to newer posts"
            iconClassName="size-4"
            render={
              <Link
                className="flex items-center gap-1 font-heading text-sm leading-none"
                href={prevHref(page.pageNumber, basePath)}
              />
            }
          />
        </PaginationItem>

        <div className="flex items-center justify-center gap-1">
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
          {/* <NavLink
            disabled={!page.hasNext}
            href={nextHref(page.pageNumber, basePath)}
            label="Go to older posts"
          >
            Older
            <ChevronRightIcon />
          </NavLink> */}
          <PaginationNext
            disabled={!page.hasNext}
            text="older"
            aria-label="Go to older posts"
            iconClassName="size-4"
            render={
              <Link
                className="flex items-center gap-1 font-heading text-sm leading-none"
                href={nextHref(page.pageNumber, basePath)}
              />
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
