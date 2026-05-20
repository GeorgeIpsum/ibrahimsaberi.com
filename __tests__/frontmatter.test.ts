import { describe, expect, it } from "vitest";
import { FrontmatterSchema } from "@/services/basin/types";

describe("FrontmatterSchema", () => {
  it("accepts a minimal post with only the required fields", () => {
    const input = { title: "Hello", publishedAt: "2026-05-20T04:00:00.000Z" };
    expect(FrontmatterSchema.assert(input)).toEqual(input);
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
    expect(FrontmatterSchema.assert(input)).toEqual(input);
  });

  it("rejects frontmatter missing the title", () => {
    expect(() =>
      FrontmatterSchema.assert({ publishedAt: "2026-05-20T04:00:00.000Z" }),
    ).toThrow();
  });

  it("rejects frontmatter missing publishedAt", () => {
    expect(() => FrontmatterSchema.assert({ title: "Hello" })).toThrow();
  });

  it("rejects a non-array tags value", () => {
    expect(() =>
      FrontmatterSchema.assert({
        title: "Hello",
        publishedAt: "2026-05-20T04:00:00.000Z",
        tags: "career",
      }),
    ).toThrow();
  });

  it("rejects a tags array containing non-strings", () => {
    expect(() =>
      FrontmatterSchema.assert({
        title: "Hello",
        publishedAt: "2026-05-20T04:00:00.000Z",
        tags: [1, 2],
      }),
    ).toThrow();
  });

  it("rejects a non-boolean draft value", () => {
    expect(() =>
      FrontmatterSchema.assert({
        title: "Hello",
        publishedAt: "2026-05-20T04:00:00.000Z",
        draft: "true",
      }),
    ).toThrow();
  });

  it("rejects an optional field present with the wrong type", () => {
    expect(() =>
      FrontmatterSchema.assert({
        title: "Hello",
        publishedAt: "2026-05-20T04:00:00.000Z",
        author: 123,
      }),
    ).toThrow();
  });
});
