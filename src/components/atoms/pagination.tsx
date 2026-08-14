"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import type * as React from "react";
import { type Button, buttonVariants } from "@/components/atoms/button";
import { cn } from "@/css/lib";

export function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">): React.ReactElement {
  return (
    <nav
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      data-slot="pagination"
      {...props}
    />
  );
}

export function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">): React.ReactElement {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      data-slot="pagination-content"
      {...props}
    />
  );
}

export function PaginationItem({
  ...props
}: React.ComponentProps<"li">): React.ReactElement {
  return <li data-slot="pagination-item" {...props} />;
}

export type PaginationLinkProps = {
  isActive?: boolean;
  size?: React.ComponentProps<typeof Button>["size"];
} & useRender.ComponentProps<"a">;

export function PaginationLink({
  className,
  isActive,
  size = "icon",
  render,
  ...props
}: PaginationLinkProps): React.ReactElement {
  const defaultProps = {
    "aria-current": isActive ? ("page" as const) : undefined,
    className: render
      ? className
      : cn(
          buttonVariants({
            size,
            variant: isActive ? "outline" : "ghost",
          }),
          className,
        ),
    "data-active": isActive,
    "data-slot": "pagination-link",
  };

  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(defaultProps, props),
    render,
  });
}

type MovePaginationProps = React.ComponentProps<typeof PaginationLink> & {
  text?: string;
  disabled?: boolean;
  iconClassName?: string;
};

export function PaginationPrevious({
  className,
  text = "Previous",
  disabled,
  iconClassName,
  ...props
}: MovePaginationProps): React.ReactElement {
  return (
    <PaginationLink
      aria-label={props["aria-label"] ?? "Go to previous page"}
      aria-disabled={disabled}
      className={cn(
        "max-sm:aspect-square max-sm:p-0",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className,
      )}
      size="default"
      {...props}
    >
      <ChevronLeftIcon className={cn("sm:-ms-1", iconClassName)} />
      <span className="max-sm:hidden">{text}</span>
    </PaginationLink>
  );
}

export function PaginationNext({
  className,
  text = "Next",
  disabled,
  iconClassName,
  ...props
}: MovePaginationProps): React.ReactElement {
  return (
    <PaginationLink
      aria-label={props["aria-label"] ?? "Go to next page"}
      aria-disabled={disabled}
      className={cn(
        "max-sm:aspect-square max-sm:p-0",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      size="default"
      {...props}
    >
      <span className="max-sm:hidden">{text}</span>
      <ChevronRightIcon className={cn("sm:-me-1", iconClassName)} />
    </PaginationLink>
  );
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      aria-hidden
      className={cn("flex min-w-7 justify-center", className)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon className="size-5 sm:size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
