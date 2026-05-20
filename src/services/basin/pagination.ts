export const POSTS_PER_PAGE = 8;

export type PageInfo = {
  pageNumber: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function makePageInfo(
  pageNumber: number,
  totalItems: number,
  pageSize: number = POSTS_PER_PAGE,
): PageInfo {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clamped = Math.min(Math.max(1, pageNumber), totalPages);
  return {
    pageNumber: clamped,
    totalPages,
    hasPrev: clamped > 1,
    hasNext: clamped < totalPages,
  };
}

// Page 1 lives at the base path (canonical); pages 2+ at `${base}/page/N`.
export function pageHref(
  pageNumber: number,
  basePath: string = "/basin",
): string {
  return pageNumber <= 1 ? basePath : `${basePath}/page/${pageNumber}`;
}

export function prevHref(
  pageNumber: number,
  basePath: string = "/basin",
): string {
  return pageHref(pageNumber - 1, basePath);
}

export function nextHref(
  pageNumber: number,
  basePath: string = "/basin",
): string {
  return pageHref(pageNumber + 1, basePath);
}

// Page tokens to render: page 1, the last page, and current ± 1. A gap that
// hides exactly one page renders that page's number; a gap hiding 2+ pages
// renders a single "ellipsis".
export function pageWindow(
  pageNumber: number,
  totalPages: number,
): (number | "ellipsis")[] {
  const shown = new Set<number>();
  for (const p of [1, totalPages, pageNumber - 1, pageNumber, pageNumber + 1]) {
    if (p >= 1 && p <= totalPages) shown.add(p);
  }
  const sorted = [...shown].sort((a, b) => a - b);

  const tokens: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (i > 0) {
      const gap = current - sorted[i - 1];
      if (gap === 2) {
        tokens.push(sorted[i - 1] + 1);
      } else if (gap > 2) {
        tokens.push("ellipsis");
      }
    }
    tokens.push(current);
  }
  return tokens;
}
