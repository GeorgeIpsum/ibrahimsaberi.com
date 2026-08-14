import { describe, expect, it } from "vitest";
import {
  DropletFrontmatterSchema,
  RippleFrontmatterSchema,
} from "@/features/basin/types";

describe("RippleFrontmatterSchema", () => {
  it("accepts a minimal post with only the required fields", () => {
    const input = { title: "Hello", publishedAt: "2026-05-20T04:00:00.000Z" };
    expect(RippleFrontmatterSchema.assert(input)).toEqual(input);
  });

  it("accepts a post with every optional field populated", () => {
    const input = {
      title: "Hello",
      author: "Ibrahim Saberi",
      publishedAt: "2026-05-20T04:00:00.000Z",
      blurb: "a short summary",
      tags: ["career", "ramblings"],
      draft: true,
    };
    expect(RippleFrontmatterSchema.assert(input)).toEqual(input);
  });

  it("rejects frontmatter missing the title", () => {
    expect(() =>
      RippleFrontmatterSchema.assert({
        publishedAt: "2026-05-20T04:00:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects frontmatter missing publishedAt", () => {
    expect(() => RippleFrontmatterSchema.assert({ title: "Hello" })).toThrow();
  });

  it("rejects a non-array tags value", () => {
    expect(() =>
      RippleFrontmatterSchema.assert({
        title: "Hello",
        publishedAt: "2026-05-20T04:00:00.000Z",
        tags: "career",
      }),
    ).toThrow();
  });

  it("rejects a tags array containing non-strings", () => {
    expect(() =>
      RippleFrontmatterSchema.assert({
        title: "Hello",
        publishedAt: "2026-05-20T04:00:00.000Z",
        tags: [1, 2],
      }),
    ).toThrow();
  });

  it("rejects a non-boolean draft value", () => {
    expect(() =>
      RippleFrontmatterSchema.assert({
        title: "Hello",
        publishedAt: "2026-05-20T04:00:00.000Z",
        draft: "true",
      }),
    ).toThrow();
  });

  it("rejects an optional field present with the wrong type", () => {
    expect(() =>
      RippleFrontmatterSchema.assert({
        title: "Hello",
        publishedAt: "2026-05-20T04:00:00.000Z",
        author: 123,
      }),
    ).toThrow();
  });
});

describe("DropletFrontmatterSchema", () => {
  it("accepts an entry with only publishedAt (title is optional)", () => {
    const input = { publishedAt: "2026-07-05T04:00:00.000Z" };
    expect(DropletFrontmatterSchema.assert(input)).toEqual(input);
  });

  it("accepts an entry with every optional field populated", () => {
    const input = {
      title: "first drop",
      publishedAt: "2026-07-05T04:00:00.000Z",
      tags: ["meta"],
      draft: true,
    };
    expect(DropletFrontmatterSchema.assert(input)).toEqual(input);
  });

  it("rejects an entry missing publishedAt", () => {
    expect(() => DropletFrontmatterSchema.assert({ title: "x" })).toThrow();
  });

  it("rejects a non-array tags value", () => {
    expect(() =>
      DropletFrontmatterSchema.assert({
        publishedAt: "2026-07-05T04:00:00.000Z",
        tags: "meta",
      }),
    ).toThrow();
  });

  it("rejects a non-boolean draft value", () => {
    expect(() =>
      DropletFrontmatterSchema.assert({
        publishedAt: "2026-07-05T04:00:00.000Z",
        draft: "true",
      }),
    ).toThrow();
  });

  it("rejects a non-string title", () => {
    expect(() =>
      DropletFrontmatterSchema.assert({
        title: 123,
        publishedAt: "2026-07-05T04:00:00.000Z",
      }),
    ).toThrow();
  });
});
