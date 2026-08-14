import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";
import {
  countSectionPosts,
  listSectionPosts,
  listSectionTags,
  loadSectionPostMeta,
} from "@/features/basin/load-section";

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

const readdirMock = readdir as unknown as Mock<
  (dir: string, opts?: unknown) => Promise<string[]>
>;
const readFileMock = readFile as unknown as Mock<
  (p: string) => Promise<string>
>;

function mdx(frontmatter: Record<string, unknown>, body = "post body"): string {
  const lines = Object.entries(frontmatter).map(
    ([key, value]) => `${key}: ${JSON.stringify(value)}`,
  );
  return `---\n${lines.join("\n")}\n---\n${body}\n`;
}

type SectionFiles = Partial<
  Record<"ripples" | "droplets", Record<string, string>>
>;

// Keys are paths relative to the section dir, POSIX separators
// ("2026-05-20-hello.mdx" or "2026/07/2026-07-05-drop.mdx"). A section
// absent from `bySection` behaves as a missing directory (ENOENT).
function setFiles(bySection: SectionFiles): void {
  readdirMock.mockImplementation(async (dir) => {
    const section = path.basename(String(dir)) as keyof SectionFiles;
    const files = bySection[section];
    if (!files) {
      const err = new Error(
        `ENOENT: no such directory '${String(dir)}'`,
      ) as NodeJS.ErrnoException;
      err.code = "ENOENT";
      throw err;
    }
    return Object.keys(files).map((rel) => rel.split("/").join(path.sep));
  });
  readFileMock.mockImplementation(async (filePath) => {
    const p = String(filePath);
    const section = p.split(path.sep).includes("droplets")
      ? "droplets"
      : "ripples";
    const hit = Object.entries(bySection[section] ?? {}).find(([rel]) =>
      p.endsWith(rel.split("/").join(path.sep)),
    );
    if (!hit) throw new Error(`ENOENT: no such file '${p}'`);
    return hit[1];
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("listSectionPosts (ripples)", () => {
  it("returns posts newest-first by filename date", async () => {
    setFiles({
      ripples: {
        "2024-03-01-old.mdx": mdx({ title: "Old" }),
        "2026-05-20-new.mdx": mdx({ title: "New" }),
        "2025-01-10-mid.mdx": mdx({ title: "Mid" }),
      },
    });
    const posts = await listSectionPosts("ripples");
    expect(posts.map((p) => p.slug)).toEqual(["new", "mid", "old"]);
  });

  it("slices the first N posts with take", async () => {
    setFiles({
      ripples: {
        "2026-03-01-a.mdx": mdx({ title: "A" }),
        "2026-02-01-b.mdx": mdx({ title: "B" }),
        "2026-01-01-c.mdx": mdx({ title: "C" }),
      },
    });
    const posts = await listSectionPosts("ripples", { take: 2 });
    expect(posts.map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("paginates with skip and take", async () => {
    setFiles({
      ripples: {
        "2026-03-01-a.mdx": mdx({ title: "A" }),
        "2026-02-01-b.mdx": mdx({ title: "B" }),
        "2026-01-01-c.mdx": mdx({ title: "C" }),
      },
    });
    const posts = await listSectionPosts("ripples", { skip: 1, take: 1 });
    expect(posts.map((p) => p.slug)).toEqual(["b"]);
  });

  it("includes draft posts in development", async () => {
    setFiles({
      ripples: {
        "2026-02-01-live.mdx": mdx({ title: "Live" }),
        "2026-01-01-wip.mdx": mdx({ title: "WIP", draft: true }),
      },
    });
    const posts = await listSectionPosts("ripples");
    expect(posts.map((p) => p.slug)).toEqual(["live", "wip"]);
  });

  it("excludes draft posts in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    setFiles({
      ripples: {
        "2026-02-01-live.mdx": mdx({ title: "Live" }),
        "2026-01-01-wip.mdx": mdx({ title: "WIP", draft: true }),
      },
    });
    const posts = await listSectionPosts("ripples");
    expect(posts.map((p) => p.slug)).toEqual(["live"]);
  });

  it("ignores files that aren't dated .mdx posts", async () => {
    setFiles({
      ripples: {
        "2026-05-20-hello.mdx": mdx({ title: "Hello" }),
        "undated-notes.mdx": mdx({ title: "Notes" }),
        ".DS_Store": "",
        "README.md": "# readme",
      },
    });
    const posts = await listSectionPosts("ripples");
    expect(posts.map((p) => p.slug)).toEqual(["hello"]);
  });

  it("derives publishedAt from the filename, overriding any frontmatter value", async () => {
    setFiles({
      ripples: {
        "2026-05-20-hello.mdx": mdx({
          title: "Hello",
          publishedAt: "1999-12-31",
        }),
      },
    });
    const [post] = await listSectionPosts("ripples");
    expect(post.frontmatter.publishedAt).toBe("2026-05-20T00:00:00.000-04:00");
  });

  it("filters by tag", async () => {
    setFiles({
      ripples: {
        "2026-03-01-career.mdx": mdx({ title: "Career", tags: ["career"] }),
        "2026-02-01-both.mdx": mdx({ title: "Both", tags: ["career", "life"] }),
        "2026-01-01-life.mdx": mdx({ title: "Life", tags: ["life"] }),
      },
    });
    const posts = await listSectionPosts("ripples", { tag: "career" });
    expect(posts.map((p) => p.slug)).toEqual(["career", "both"]);
  });

  it("rejects a ripple without a title", async () => {
    setFiles({
      ripples: { "2026-05-20-untitled.mdx": mdx({ draft: false }) },
    });
    await expect(listSectionPosts("ripples")).rejects.toThrow();
  });
});

describe("listSectionPosts (droplets)", () => {
  it("accepts entries without a title", async () => {
    setFiles({
      droplets: {
        "2026/07/2026-07-05-morning.mdx": mdx({}),
        "2026/07/2026-07-01-untitled.mdx": mdx({ tags: ["meta"] }),
      },
    });
    const posts = await listSectionPosts("droplets");
    expect(posts.map((p) => p.slug)).toEqual(["morning", "untitled"]);
    expect(posts[0].frontmatter.title).toBeUndefined();
  });

  it("lists entries nested in YYYY/MM folders", async () => {
    setFiles({
      droplets: {
        "2026/07/2026-07-05-a.mdx": mdx({ title: "a" }),
        "2025/12/2025-12-31-b.mdx": mdx({}),
      },
    });
    const posts = await listSectionPosts("droplets");
    expect(posts.map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("fails the build when the folder contradicts the filename date", async () => {
    setFiles({
      droplets: { "2026/06/2026-07-05-misplaced.mdx": mdx({}) },
    });
    await expect(listSectionPosts("droplets")).rejects.toThrow(
      /Invalid content placement/,
    );
  });

  it("treats a missing section directory as empty", async () => {
    setFiles({ ripples: { "2026-05-20-hello.mdx": mdx({ title: "Hello" }) } });
    await expect(listSectionPosts("droplets")).resolves.toEqual([]);
    await expect(countSectionPosts("droplets")).resolves.toBe(0);
  });

  it("accepts date-only filenames, defaulting the slug to the date", async () => {
    setFiles({
      droplets: {
        "2026/07/2026-07-05.mdx": mdx({}),
        "2026/07/2026-07-04-evening.mdx": mdx({}),
      },
    });
    const posts = await listSectionPosts("droplets");
    expect(posts.map((p) => p.slug)).toEqual(["2026-07-05", "evening"]);
  });

  it("still skips date-only filenames in ripples", async () => {
    setFiles({
      ripples: {
        "2026-05-20.mdx": mdx({ title: "No Slug" }),
        "2026-05-19-kept.mdx": mdx({ title: "Kept" }),
      },
    });
    const posts = await listSectionPosts("ripples");
    expect(posts.map((p) => p.slug)).toEqual(["kept"]);
  });

  it("accepts a droplet with no frontmatter block at all", async () => {
    setFiles({
      droplets: {
        "2026/07/2026-07-05.mdx": "just a bare thought, no fences\n",
      },
    });
    const posts = await listSectionPosts("droplets");
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("2026-07-05");
    expect(posts[0].frontmatter.publishedAt).toBe(
      "2026-07-05T00:00:00.000-04:00",
    );
    expect(posts[0].frontmatter.title).toBeUndefined();
  });

  it("keeps sections independent", async () => {
    setFiles({
      ripples: { "2026-05-20-ripple.mdx": mdx({ title: "Ripple" }) },
      droplets: { "2026/07/2026-07-05-drop.mdx": mdx({}) },
    });
    const ripples = await listSectionPosts("ripples");
    const droplets = await listSectionPosts("droplets");
    expect(ripples.map((p) => p.slug)).toEqual(["ripple"]);
    expect(droplets.map((p) => p.slug)).toEqual(["drop"]);
  });
});

describe("countSectionPosts", () => {
  it("counts every dated file in development, drafts included", async () => {
    setFiles({
      ripples: {
        "2026-02-01-live.mdx": mdx({ title: "Live" }),
        "2026-01-01-wip.mdx": mdx({ title: "WIP", draft: true }),
        "notes.txt": "x",
      },
    });
    expect(await countSectionPosts("ripples")).toBe(2);
  });

  it("excludes drafts in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    setFiles({
      ripples: {
        "2026-02-01-live.mdx": mdx({ title: "Live" }),
        "2026-01-01-wip.mdx": mdx({ title: "WIP", draft: true }),
      },
    });
    expect(await countSectionPosts("ripples")).toBe(1);
  });

  it("counts only posts matching a tag", async () => {
    setFiles({
      ripples: {
        "2026-03-01-a.mdx": mdx({ title: "A", tags: ["career"] }),
        "2026-02-01-b.mdx": mdx({ title: "B", tags: ["life"] }),
        "2026-01-01-c.mdx": mdx({ title: "C", tags: ["career"] }),
      },
    });
    expect(await countSectionPosts("ripples", { tag: "career" })).toBe(2);
  });

  it("agrees with listSectionPosts in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    setFiles({
      ripples: {
        "2026-03-01-a.mdx": mdx({ title: "A" }),
        "2026-02-01-b.mdx": mdx({ title: "B", draft: true }),
        "2026-01-01-c.mdx": mdx({ title: "C" }),
      },
    });
    expect(await countSectionPosts("ripples")).toBe(
      (await listSectionPosts("ripples")).length,
    );
  });
});

describe("listSectionTags", () => {
  it("returns the unique set of tags across posts", async () => {
    setFiles({
      ripples: {
        "2026-03-01-a.mdx": mdx({ title: "A", tags: ["career", "life"] }),
        "2026-02-01-b.mdx": mdx({ title: "B", tags: ["life"] }),
        "2026-01-01-c.mdx": mdx({ title: "C" }),
      },
    });
    expect([...(await listSectionTags("ripples"))].sort()).toEqual([
      "career",
      "life",
    ]);
  });
});

describe("loadSectionPostMeta", () => {
  it("returns slug, basename, and a summer publishedAt instant", async () => {
    setFiles({
      ripples: { "2026-05-20-hello.mdx": mdx({ title: "Hello" }) },
    });
    const meta = await loadSectionPostMeta("ripples", "hello");
    expect(meta?.slug).toBe("hello");
    expect(meta?.basename).toBe("2026-05-20-hello");
    expect(meta?.frontmatter.title).toBe("Hello");
    // May → EDT: midnight in New York carries a -04:00 offset.
    expect(meta?.frontmatter.publishedAt).toBe("2026-05-20T00:00:00.000-04:00");
  });

  it("resolves a winter date at the EST offset", async () => {
    setFiles({
      ripples: { "2026-01-15-winter.mdx": mdx({ title: "Winter" }) },
    });
    const meta = await loadSectionPostMeta("ripples", "winter");
    // January → EST: midnight in New York carries a -05:00 offset.
    expect(meta?.frontmatter.publishedAt).toBe("2026-01-15T00:00:00.000-05:00");
  });

  it("keeps the folder in a droplet basename", async () => {
    setFiles({
      droplets: { "2026/07/2026-07-05-drop.mdx": mdx({}) },
    });
    const meta = await loadSectionPostMeta("droplets", "drop");
    expect(meta?.basename).toBe("2026/07/2026-07-05-drop");
  });

  it("returns null for an unknown slug", async () => {
    setFiles({
      ripples: { "2026-05-20-hello.mdx": mdx({ title: "Hello" }) },
    });
    await expect(loadSectionPostMeta("ripples", "ghost")).resolves.toBeNull();
  });

  it("returns null for a draft post in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    setFiles({
      ripples: { "2026-05-20-wip.mdx": mdx({ title: "WIP", draft: true }) },
    });
    await expect(loadSectionPostMeta("ripples", "wip")).resolves.toBeNull();
  });

  it("returns a draft post's meta in development", async () => {
    setFiles({
      ripples: { "2026-05-20-wip.mdx": mdx({ title: "WIP", draft: true }) },
    });
    const meta = await loadSectionPostMeta("ripples", "wip");
    expect(meta?.slug).toBe("wip");
  });
});
