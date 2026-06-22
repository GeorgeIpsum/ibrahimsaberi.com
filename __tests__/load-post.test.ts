import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";
import {
  countPosts,
  listPosts,
  listTags,
  loadRippleMeta,
} from "@/features/basin/load-post";

// React's `cache()` memoizes per request; outside a render there is no request.
// Make it a passthrough so each call re-reads the (mocked) filesystem.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: ((fn: unknown) => fn) as typeof actual.cache };
});

// `notFound()` throws a framework-internal error; a plain throw is enough here.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}));

const readdirMock = readdir as unknown as Mock<() => Promise<string[]>>;
const readFileMock = readFile as unknown as Mock<
  (p: string) => Promise<string>
>;

function mdx(frontmatter: Record<string, unknown>, body = "post body"): string {
  const lines = Object.entries(frontmatter).map(
    ([key, value]) => `${key}: ${JSON.stringify(value)}`,
  );
  return `---\n${lines.join("\n")}\n---\n${body}\n`;
}

function setFiles(files: Record<string, string>): void {
  readdirMock.mockResolvedValue(Object.keys(files));
  readFileMock.mockImplementation(async (filePath) => {
    const content = files[path.basename(filePath)];
    if (content === undefined) {
      throw new Error(`ENOENT: no such file '${filePath}'`);
    }
    return content;
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("listPosts", () => {
  it("returns posts newest-first by filename date", async () => {
    setFiles({
      "2024-03-01-old.mdx": mdx({ title: "Old" }),
      "2026-05-20-new.mdx": mdx({ title: "New" }),
      "2025-01-10-mid.mdx": mdx({ title: "Mid" }),
    });
    const posts = await listPosts();
    expect(posts.map((p) => p.slug)).toEqual(["new", "mid", "old"]);
  });

  it("slices the first N posts with take", async () => {
    setFiles({
      "2026-03-01-a.mdx": mdx({ title: "A" }),
      "2026-02-01-b.mdx": mdx({ title: "B" }),
      "2026-01-01-c.mdx": mdx({ title: "C" }),
    });
    const posts = await listPosts({ take: 2 });
    expect(posts.map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("paginates with skip and take", async () => {
    setFiles({
      "2026-03-01-a.mdx": mdx({ title: "A" }),
      "2026-02-01-b.mdx": mdx({ title: "B" }),
      "2026-01-01-c.mdx": mdx({ title: "C" }),
    });
    const posts = await listPosts({ skip: 1, take: 1 });
    expect(posts.map((p) => p.slug)).toEqual(["b"]);
  });

  it("includes draft posts in development", async () => {
    setFiles({
      "2026-02-01-live.mdx": mdx({ title: "Live" }),
      "2026-01-01-wip.mdx": mdx({ title: "WIP", draft: true }),
    });
    const posts = await listPosts();
    expect(posts.map((p) => p.slug)).toEqual(["live", "wip"]);
  });

  it("excludes draft posts in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    setFiles({
      "2026-02-01-live.mdx": mdx({ title: "Live" }),
      "2026-01-01-wip.mdx": mdx({ title: "WIP", draft: true }),
    });
    const posts = await listPosts();
    expect(posts.map((p) => p.slug)).toEqual(["live"]);
  });

  it("ignores files that aren't dated .mdx posts", async () => {
    setFiles({
      "2026-05-20-hello.mdx": mdx({ title: "Hello" }),
      "undated-notes.mdx": mdx({ title: "Notes" }),
      ".DS_Store": "",
      "README.md": "# readme",
    });
    const posts = await listPosts();
    expect(posts.map((p) => p.slug)).toEqual(["hello"]);
  });

  it("derives publishedAt from the filename, overriding any frontmatter value", async () => {
    setFiles({
      "2026-05-20-hello.mdx": mdx({
        title: "Hello",
        publishedAt: "1999-12-31",
      }),
    });
    const [post] = await listPosts();
    expect(post.frontmatter.publishedAt).toBe("2026-05-20T00:00:00.000-04:00");
  });

  it("filters by tag", async () => {
    setFiles({
      "2026-03-01-career.mdx": mdx({ title: "Career", tags: ["career"] }),
      "2026-02-01-both.mdx": mdx({ title: "Both", tags: ["career", "life"] }),
      "2026-01-01-life.mdx": mdx({ title: "Life", tags: ["life"] }),
    });
    const posts = await listPosts({ tag: "career" });
    expect(posts.map((p) => p.slug)).toEqual(["career", "both"]);
  });
});

describe("countPosts", () => {
  it("counts every dated file in development, drafts included", async () => {
    setFiles({
      "2026-02-01-live.mdx": mdx({ title: "Live" }),
      "2026-01-01-wip.mdx": mdx({ title: "WIP", draft: true }),
      "notes.txt": "x",
    });
    expect(await countPosts()).toBe(2);
  });

  it("excludes drafts in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    setFiles({
      "2026-02-01-live.mdx": mdx({ title: "Live" }),
      "2026-01-01-wip.mdx": mdx({ title: "WIP", draft: true }),
    });
    expect(await countPosts()).toBe(1);
  });

  it("counts only posts matching a tag", async () => {
    setFiles({
      "2026-03-01-a.mdx": mdx({ title: "A", tags: ["career"] }),
      "2026-02-01-b.mdx": mdx({ title: "B", tags: ["life"] }),
      "2026-01-01-c.mdx": mdx({ title: "C", tags: ["career"] }),
    });
    expect(await countPosts({ tag: "career" })).toBe(2);
  });

  it("agrees with listPosts in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    setFiles({
      "2026-03-01-a.mdx": mdx({ title: "A" }),
      "2026-02-01-b.mdx": mdx({ title: "B", draft: true }),
      "2026-01-01-c.mdx": mdx({ title: "C" }),
    });
    expect(await countPosts()).toBe((await listPosts()).length);
  });
});

describe("listTags", () => {
  it("returns the unique set of tags across posts", async () => {
    setFiles({
      "2026-03-01-a.mdx": mdx({ title: "A", tags: ["career", "life"] }),
      "2026-02-01-b.mdx": mdx({ title: "B", tags: ["life"] }),
      "2026-01-01-c.mdx": mdx({ title: "C" }),
    });
    expect([...(await listTags())].sort()).toEqual(["career", "life"]);
  });
});

describe("loadPostMeta", () => {
  it("returns slug, basename, and a summer publishedAt instant", async () => {
    setFiles({ "2026-05-20-hello.mdx": mdx({ title: "Hello" }) });
    const meta = await loadRippleMeta("hello");
    expect(meta?.slug).toBe("hello");
    expect(meta?.basename).toBe("2026-05-20-hello");
    expect(meta?.frontmatter.title).toBe("Hello");
    // May → EDT: midnight in New York carries a -04:00 offset.
    expect(meta?.frontmatter.publishedAt).toBe("2026-05-20T00:00:00.000-04:00");
  });

  it("resolves a winter date at the EST offset", async () => {
    setFiles({ "2026-01-15-winter.mdx": mdx({ title: "Winter" }) });
    const meta = await loadRippleMeta("winter");
    // January → EST: midnight in New York carries a -05:00 offset.
    expect(meta?.frontmatter.publishedAt).toBe("2026-01-15T00:00:00.000-05:00");
  });

  it("returns null for an unknown slug", async () => {
    setFiles({ "2026-05-20-hello.mdx": mdx({ title: "Hello" }) });
    await expect(loadRippleMeta("ghost")).resolves.toBeNull();
  });
});
