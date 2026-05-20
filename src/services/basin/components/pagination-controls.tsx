"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { buttonVariants } from "@/components/atoms/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/atoms/pagination";
import { cn } from "@/css/lib";
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
        <PaginationItem className="font-heading">
          <NavLink
            disabled={!page.hasPrev}
            href={prevHref(page.pageNumber, basePath)}
            label="Go to newer posts"
          >
            <ChevronLeftIcon />
            Newer
          </NavLink>
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

        <PaginationItem className="w-24 font-heading">
          <NavLink
            disabled={!page.hasNext}
            href={nextHref(page.pageNumber, basePath)}
            label="Go to older posts"
          >
            Older
            <ChevronRightIcon />
          </NavLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function NavLink({
  children,
  disabled,
  href,
  label,
}: {
  children: React.ReactNode;
  disabled: boolean;
  href: string;
  label: string;
}) {
  return (
    <PaginationLink
      aria-disabled={disabled || undefined}
      aria-label={label}
      className={cn(
        buttonVariants({ size: "default", variant: "ghost" }),
        disabled && "pointer-events-none opacity-50",
      )}
      render={
        disabled ? (
          <span className="w-22" />
        ) : (
          <Link className="w-22" href={href} />
        )
      }
    >
      {children}
    </PaginationLink>
  );
}
