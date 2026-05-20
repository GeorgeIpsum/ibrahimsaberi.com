import { describe, expect, it } from "vitest";
import {
  makePageInfo,
  nextHref,
  pageHref,
  pageWindow,
  prevHref,
} from "../src/services/basin/pagination";

describe("pageHref", () => {
  it("returns the base path for page 1", () => {
    expect(pageHref(1, "/basin")).toBe("/basin");
  });

  it("clamps page 0 and negative pages to the base path", () => {
    expect(pageHref(0, "/basin")).toBe("/basin");
    expect(pageHref(-3, "/basin")).toBe("/basin");
  });

  it("appends /page/N for pages 2 and up", () => {
    expect(pageHref(2, "/basin")).toBe("/basin/page/2");
    expect(pageHref(7, "/basin")).toBe("/basin/page/7");
  });

  it("respects a custom base path", () => {
    expect(pageHref(3, "/basin/tags/career")).toBe("/basin/tags/career/page/3");
  });

  it("defaults the base path to /basin", () => {
    expect(pageHref(2)).toBe("/basin/page/2");
  });
});

describe("prevHref / nextHref", () => {
  it("prevHref from page 2 lands on the canonical base path", () => {
    expect(prevHref(2, "/basin")).toBe("/basin");
  });

  it("prevHref from page 3+ points at the previous numbered page", () => {
    expect(prevHref(3, "/basin")).toBe("/basin/page/2");
  });

  it("nextHref points at the following numbered page", () => {
    expect(nextHref(1, "/basin")).toBe("/basin/page/2");
    expect(nextHref(4, "/basin")).toBe("/basin/page/5");
  });
});

describe("makePageInfo", () => {
  it("clamps a page number above the total down to the last page", () => {
    const info = makePageInfo(99, 25, 10);
    expect(info.pageNumber).toBe(3);
    expect(info.totalPages).toBe(3);
  });

  it("clamps a page number below 1 up to page 1", () => {
    expect(makePageInfo(0, 25, 10).pageNumber).toBe(1);
    expect(makePageInfo(-5, 25, 10).pageNumber).toBe(1);
  });

  it("reports at least one page when there are no items", () => {
    const info = makePageInfo(1, 0, 10);
    expect(info.totalPages).toBe(1);
    expect(info.hasPrev).toBe(false);
    expect(info.hasNext).toBe(false);
  });

  it("sets hasPrev/hasNext correctly at the boundaries", () => {
    const first = makePageInfo(1, 25, 10);
    expect(first.hasPrev).toBe(false);
    expect(first.hasNext).toBe(true);

    const last = makePageInfo(3, 25, 10);
    expect(last.hasPrev).toBe(true);
    expect(last.hasNext).toBe(false);
  });
});

describe("pageWindow", () => {
  it("returns a single page when there is only one", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it("lists every page with no ellipsis for a short run", () => {
    expect(pageWindow(1, 2)).toEqual([1, 2]);
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("renders a single hidden page as its number, not an ellipsis", () => {
    expect(pageWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("inserts an ellipsis where two or more pages are hidden", () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, "ellipsis", 10]);
  });

  it("inserts ellipses on both sides for a mid-range current page", () => {
    expect(pageWindow(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("keeps the trailing pages adjacent when current is near the end", () => {
    expect(pageWindow(9, 10)).toEqual([1, "ellipsis", 8, 9, 10]);
  });
});
