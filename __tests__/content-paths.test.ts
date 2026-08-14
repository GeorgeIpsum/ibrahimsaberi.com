import { describe, expect, it } from "vitest";
import { classifyContentPath } from "@/features/basin/content-paths";

describe("classifyContentPath", () => {
  it("classifies a post at the content root", () => {
    expect(classifyContentPath("2026-05-20-hello.mdx")).toEqual({
      kind: "post",
      file: "2026-05-20-hello.mdx",
      dateStr: "2026-05-20",
      slug: "hello",
    });
  });

  it("classifies a post inside a matching year folder", () => {
    expect(classifyContentPath("2026/2026-05-20-hello.mdx")).toEqual({
      kind: "post",
      file: "2026/2026-05-20-hello.mdx",
      dateStr: "2026-05-20",
      slug: "hello",
    });
  });

  it("classifies a post inside a matching year/month folder", () => {
    expect(classifyContentPath("2026/05/2026-05-20-hello.mdx")).toEqual({
      kind: "post",
      file: "2026/05/2026-05-20-hello.mdx",
      dateStr: "2026-05-20",
      slug: "hello",
    });
  });

  it("keeps multi-hyphen slugs intact", () => {
    expect(classifyContentPath("2026-05-20-a-longer-slug.mdx")).toMatchObject({
      kind: "post",
      slug: "a-longer-slug",
    });
  });

  it("flags a post whose year folder contradicts the filename date", () => {
    expect(classifyContentPath("2025/2026-05-20-hello.mdx")).toEqual({
      kind: "invalid",
      file: "2025/2026-05-20-hello.mdx",
      reason: 'folder year "2025" does not match filename date "2026-05-20"',
    });
  });

  it("flags a post whose year/month folder contradicts the filename date", () => {
    expect(classifyContentPath("2026/04/2026-05-20-hello.mdx")).toEqual({
      kind: "invalid",
      file: "2026/04/2026-05-20-hello.mdx",
      reason: 'folder "2026/04" does not match filename date "2026-05-20"',
    });
  });

  it("skips a post-named file in a non-numeric folder", () => {
    expect(classifyContentPath("drafts/2026-05-20-hello.mdx")).toEqual({
      kind: "skip",
    });
  });

  it("skips a post-named file nested three folders deep", () => {
    expect(classifyContentPath("2026/05/extra/2026-05-20-hello.mdx")).toEqual({
      kind: "skip",
    });
  });

  it("skips a one-digit month folder", () => {
    expect(classifyContentPath("2026/5/2026-05-20-hello.mdx")).toEqual({
      kind: "skip",
    });
  });

  it("skips files that are not dated .mdx posts", () => {
    expect(classifyContentPath("notes.md")).toEqual({ kind: "skip" });
    expect(classifyContentPath("hello.mdx")).toEqual({ kind: "skip" });
  });

  it("skips a date-only filename when slugs are required", () => {
    expect(classifyContentPath("2026-05-20.mdx")).toEqual({ kind: "skip" });
  });
});

describe("classifyContentPath with slugOptional", () => {
  it("classifies a date-only filename, defaulting the slug to the date", () => {
    expect(
      classifyContentPath("2026-05-20.mdx", { slugOptional: true }),
    ).toEqual({
      kind: "post",
      file: "2026-05-20.mdx",
      dateStr: "2026-05-20",
      slug: "2026-05-20",
    });
  });

  it("classifies a date-only filename inside a matching year/month folder", () => {
    expect(
      classifyContentPath("2026/05/2026-05-20.mdx", { slugOptional: true }),
    ).toEqual({
      kind: "post",
      file: "2026/05/2026-05-20.mdx",
      dateStr: "2026-05-20",
      slug: "2026-05-20",
    });
  });

  it("keeps the short slug when one is present", () => {
    expect(
      classifyContentPath("2026-05-20-morning.mdx", { slugOptional: true }),
    ).toMatchObject({
      kind: "post",
      slug: "morning",
    });
  });

  it("flags a date-only filename whose folder contradicts the date", () => {
    expect(
      classifyContentPath("2026/04/2026-05-20.mdx", { slugOptional: true }),
    ).toEqual({
      kind: "invalid",
      file: "2026/04/2026-05-20.mdx",
      reason: 'folder "2026/04" does not match filename date "2026-05-20"',
    });
  });

  it("still skips undated files", () => {
    expect(classifyContentPath("hello.mdx", { slugOptional: true })).toEqual({
      kind: "skip",
    });
  });
});
