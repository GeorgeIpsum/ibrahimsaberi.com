# Basin Droplets Segmentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Segment basin content into ripples (existing long-form posts) and droplets (a microjournal stream at `/basin/droplets` with permalinks), sharing one generic loader core.

**Architecture:** Split `src/features/basin/load-post.ts` into a section-generic core (`load-section.ts`) whose cached functions take a serializable section name (`"ripples" | "droplets"`) and look up per-section config (frontmatter schema, MDX import thunk) in a module-scope registry, plus thin `ripples.ts` / `droplets.ts` binding wrappers. New routes render droplets as an inline paginated stream with per-entry permalink pages.

**Tech Stack:** Next.js (App Router, Cache Components / `"use cache"`), React Server Components, arktype, front-matter, vitest, Tailwind, Biome.

**Spec:** `docs/superpowers/specs/2026-07-05-basin-droplets-segmentation-design.md`

## Global Constraints

- **NO git operations.** Ibrahim handles all staging/committing himself. Never run `git add`, `git commit`, `git checkout`, or revert working-tree changes. The plan has no commit steps by design.
- **Concurrent edits:** Ibrahim edits the tree while agents run. Never revert or "fix" a change outside your task's file list — treat it as his work in progress.
- `"use cache"` functions may only receive serializable arguments and closure values. Section config (schemas, import thunks) must stay at module scope, looked up by section name — never closed over or passed as arguments to cached functions.
- Dynamic MDX imports must keep a static path prefix per expression: `` import(`@/basin/ripples/${basename}.mdx`) `` and `` import(`@/basin/droplets/${basename}.mdx`) `` — never build the prefix from a variable.
- Filename date is the source of truth for `publishedAt` (format `YYYY-MM-DD-<slug>.mdx`); frontmatter `publishedAt` is always overridden.
- `AUTHOR_TIMEZONE = "America/New_York"` — all filename dates resolve to midnight in this zone.
- Test with `pnpm exec vitest run <file>`; lint with `pnpm lint` (Biome). Production build: `pnpm build`.
- Copy/tone: site copy is lowercase and understated (e.g. "Nothing yet.", "droplets", "forming waves"). Match it.

---

### Task 1: Split frontmatter schemas in `types.ts`

**Files:**
- Modify: `src/features/basin/types.ts`
- Test: `__tests__/frontmatter.test.ts`

**Interfaces:**
- Consumes: nothing new (arktype `type`).
- Produces: `RippleFrontmatterSchema` (the current `FrontmatterSchema`, renamed), `DropletFrontmatterSchema` (optional `title`, `publishedAt: string`, optional `tags`/`draft`), types `RippleFrontmatter`, `DropletFrontmatter`, generic `Post<F = RippleFrontmatter>` and `PostListEntry<F = RippleFrontmatter>`. A temporary alias `FrontmatterSchema = RippleFrontmatterSchema` keeps `load-post.ts` compiling until Task 3 deletes it.

- [x] **Step 1: Write the failing tests**

Rewrite `__tests__/frontmatter.test.ts`. Keep every existing `FrontmatterSchema` case, renamed to `RippleFrontmatterSchema` (same inputs/assertions), and add a new describe block:

```ts
import { describe, expect, it } from "vitest";
import {
  DropletFrontmatterSchema,
  RippleFrontmatterSchema,
} from "@/features/basin/types";

describe("RippleFrontmatterSchema", () => {
  // ... the 8 existing test cases from the current file, with
  // `FrontmatterSchema` replaced by `RippleFrontmatterSchema`.
  // Inputs and assertions are otherwise IDENTICAL — copy them over.
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
```

- [x] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run __tests__/frontmatter.test.ts`
Expected: FAIL — `RippleFrontmatterSchema` / `DropletFrontmatterSchema` are not exported.

- [x] **Step 3: Implement the schema split**

Replace `src/features/basin/types.ts` with:

```ts
import { type } from "arktype";

export const RippleFrontmatterSchema = type({
  title: "string",
  "author?": "string",
  publishedAt: "string",
  "blurb?": "string",
  "linkTitle?": "string",
  "tags?": "string[]",
  "draft?": "boolean",
});

export const DropletFrontmatterSchema = type({
  "title?": "string",
  publishedAt: "string",
  "tags?": "string[]",
  "draft?": "boolean",
});

export const FrontmatterSchema = RippleFrontmatterSchema;

export type RippleFrontmatter = typeof RippleFrontmatterSchema.infer;
export type DropletFrontmatter = typeof DropletFrontmatterSchema.infer;

// Kept as an alias so existing ripple-only call sites keep reading naturally.
export type Frontmatter = RippleFrontmatter;

export type Post<F = RippleFrontmatter> = {
  slug: string;
  frontmatter: F;
  Content: React.ComponentType;
};

export type PostListEntry<F = RippleFrontmatter> = {
  slug: string;
  frontmatter: F;
};
```

The generic defaults mean `post-list-item.tsx` (which uses `PostListEntry` bare and reads `blurb`/`linkTitle`) compiles unchanged.

- [x] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run __tests__/frontmatter.test.ts`
Expected: PASS (all ripple + droplet cases).

- [x] **Step 5: Verify nothing else broke**

Run: `pnpm exec vitest run && pnpm lint`
Expected: full suite PASS, lint clean. (`load-post.ts` still compiles via the `FrontmatterSchema` alias.)

---

### Task 2: Generic section loader core (`load-section.ts`)

**Files:**
- Create: `src/features/basin/load-section.ts`
- Test: `__tests__/load-section.test.ts` (adapted from `__tests__/load-post.test.ts`)

**Interfaces:**
- Consumes: `classifyContentPath` from `./content-paths` (unchanged); Task 1's schemas and generic types.
- Produces (all exported from `load-section.ts`):
  - `type SectionName = "ripples" | "droplets"`
  - `type SectionFrontmatter = { ripples: RippleFrontmatter; droplets: DropletFrontmatter }`
  - `AUTHOR_TIMEZONE: string` (moves here from `load-post.ts`)
  - `sectionDir(section: SectionName): string` — absolute path to `src/basin/<section>`
  - `type ListPostsOptions = { take?: number; skip?: number; tag?: string }`
  - `listSectionPosts<S extends SectionName>(section: S, opts?: ListPostsOptions): Promise<PostListEntry<SectionFrontmatter[S]>[]>`
  - `countSectionPosts(section: SectionName, opts?: Pick<ListPostsOptions, "tag">): Promise<number>`
  - `listSectionTags(section: SectionName): Promise<string[]>`
  - `type PostMeta<F = RippleFrontmatter> = { slug: string; frontmatter: F; basename: string }`
  - `loadSectionPostMeta<S extends SectionName>(section: S, slug: string): Promise<PostMeta<SectionFrontmatter[S]> | null>`
  - `loadSectionPost<S extends SectionName>(section: S, slug: string): Promise<Post<SectionFrontmatter[S]>>` (throws `notFound()` on unknown slug)

`load-post.ts` is NOT touched in this task — the app keeps running on it until Task 3 migrates call sites.

- [x] **Step 1: Write the failing tests**

Create `__tests__/load-section.test.ts`. It is the existing `__tests__/load-post.test.ts` adapted to the section API, with a dir-aware mock and new droplet/ENOENT cases:

```ts
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
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run __tests__/load-section.test.ts`
Expected: FAIL — module `@/features/basin/load-section` does not exist.

- [x] **Step 3: Implement `load-section.ts`**

Create `src/features/basin/load-section.ts`. This is `load-post.ts` generalized over a section name; the structure (cheap/expensive path split, caching layers, invalid-placement error, duplicate-slug warning) is preserved deliberately:

```ts
import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { TZDate } from "@date-fns/tz";
import frontMatter from "front-matter";
import { notFound } from "next/navigation";
import { cache } from "react";
import { classifyContentPath } from "./content-paths";
import {
  type DropletFrontmatter,
  DropletFrontmatterSchema,
  type Post,
  type PostListEntry,
  type RippleFrontmatter,
  RippleFrontmatterSchema,
} from "./types";

const BASIN_REL_PATH = "src/basin";
const BASIN_DIR = path.join(process.cwd(), BASIN_REL_PATH);

// All bare YAML dates (`publishedAt: 2026-05-18`) and filename-encoded dates
// are interpreted as midnight in this timezone. TZDate carries its tz with it
// so `toLocaleDateString()` formats in this tz automatically.
export const AUTHOR_TIMEZONE = "America/New_York";

export type SectionName = "ripples" | "droplets";

export type SectionFrontmatter = {
  ripples: RippleFrontmatter;
  droplets: DropletFrontmatter;
};

type AnyFrontmatter = RippleFrontmatter | DropletFrontmatter;

// Per-section config stays at module scope on purpose: the "use cache"
// functions below may only receive serializable arguments and closure values,
// so they take the section *name* and look up schemas and import thunks here.
// Each import expression keeps its static path prefix for the bundler.
const SECTIONS = {
  ripples: {
    schema: RippleFrontmatterSchema,
    importContent: (basename: string) =>
      import(`@/basin/ripples/${basename}.mdx`),
  },
  droplets: {
    schema: DropletFrontmatterSchema,
    importContent: (basename: string) =>
      import(`@/basin/droplets/${basename}.mdx`),
  },
} as const;

export function sectionDir(section: SectionName): string {
  return path.join(BASIN_DIR, section);
}

type FileEntry = {
  file: string; // path relative to the section dir, POSIX sep: "2024/2024-01-08-post.mdx"
  slug: string; // "post"
  dateStr: string; // "2024-01-08"
};

function isoFromFilenameDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return new TZDate(y, m - 1, d, AUTHOR_TIMEZONE).toISOString();
}

function normalizeAttributes(
  attrs: Record<string, unknown>,
  dateStrFromFilename: string,
): Record<string, unknown> {
  const out = { ...attrs };
  // Filename always wins. Any `publishedAt` in frontmatter is overridden — keep
  // it for human-readability but the authoritative date is the filename prefix.
  out.publishedAt = isoFromFilenameDate(dateStrFromFilename);
  return out;
}

// Emit one warning per slug shared by two or more files. Duplicate slugs are
// allowed (loadSectionPostMeta resolves to the newest by date) but worth
// surfacing.
function warnDuplicateSlugs(section: SectionName, entries: FileEntry[]): void {
  const bySlug = new Map<string, string[]>();
  for (const e of entries) {
    const files = bySlug.get(e.slug);
    if (files) files.push(e.file);
    else bySlug.set(e.slug, [e.file]);
  }
  for (const [slug, files] of bySlug) {
    if (files.length > 1) {
      console.warn(
        `Duplicate ${section} slug "${slug}" — ${files.length} files: ${files.join(", ")}`,
      );
    }
  }
}

const _listFileEntries = cache(
  async (section: SectionName): Promise<FileEntry[]> => {
    "use cache";
    // A section with no content yet has no tracked files, so its directory may
    // not exist in a fresh clone — treat that as an empty section.
    let paths: string[];
    try {
      paths = await readdir(sectionDir(section), { recursive: true });
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code === "ENOENT") return [];
      throw e;
    }

    const entries: FileEntry[] = [];
    const invalid: { file: string; reason: string }[] = [];

    for (const rel of paths) {
      if (!rel.endsWith(".mdx")) continue;
      const classified = classifyContentPath(rel);
      if (classified.kind === "skip") continue;
      if (classified.kind === "invalid") {
        invalid.push({ file: classified.file, reason: classified.reason });
        continue;
      }
      entries.push({
        file: classified.file,
        dateStr: classified.dateStr,
        slug: classified.slug,
      });
    }

    if (invalid.length > 0) {
      const list = invalid
        .map((e) => `  - ${BASIN_REL_PATH}/${section}/${e.file}: ${e.reason}`)
        .join("\n");
      throw new Error(`Invalid content placement:\n${list}`);
    }

    warnDuplicateSlugs(section, entries);
    return entries.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  },
);

async function parseEntry(
  section: SectionName,
  entry: FileEntry,
): Promise<PostListEntry<AnyFrontmatter>> {
  const raw = await readFile(
    path.join(sectionDir(section), entry.file),
    "utf-8",
  );
  const { attributes } = frontMatter<Record<string, unknown>>(raw);
  return {
    slug: entry.slug,
    frontmatter: SECTIONS[section].schema.assert(
      normalizeAttributes(attributes, entry.dateStr),
    ),
  };
}

const _listAllParsed = cache(
  async (section: SectionName): Promise<PostListEntry<AnyFrontmatter>[]> => {
    "use cache";
    const entries = await _listFileEntries(section);
    const parsed = await Promise.all(
      entries.map((entry) => parseEntry(section, entry)),
    );
    return process.env.NODE_ENV === "production"
      ? parsed.filter((p) => !p.frontmatter.draft)
      : parsed;
  },
);

export type ListPostsOptions = {
  /** Slice this many posts from the start of the (filtered) list. */
  take?: number;
  /** Drop this many posts from the start before slicing. */
  skip?: number;
  /** Only include posts whose tags include this string. */
  tag?: string;
};

export async function listSectionPosts<S extends SectionName>(
  section: S,
  opts: ListPostsOptions = {},
): Promise<PostListEntry<SectionFrontmatter[S]>[]> {
  "use cache";
  const skip = opts.skip ?? 0;

  // Cheap path: no filtering, dev mode (no draft filter needed). We can slice
  // the filename list first, then parse only the N files we actually need.
  if (!opts.tag && process.env.NODE_ENV !== "production") {
    const entries = await _listFileEntries(section);
    const sliced =
      opts.take !== undefined
        ? entries.slice(skip, skip + opts.take)
        : entries.slice(skip);
    return Promise.all(
      sliced.map((entry) => parseEntry(section, entry)),
    ) as Promise<PostListEntry<SectionFrontmatter[S]>[]>;
  }

  // Expensive path: tag filter or production (drafts must be excluded). Have
  // to parse everything to apply the filter; then slice the filtered result.
  const all = opts.tag
    ? (await _listAllParsed(section)).filter((p) =>
        p.frontmatter.tags?.includes(opts.tag as string),
      )
    : await _listAllParsed(section);
  const sliced =
    opts.take !== undefined
      ? all.slice(skip, skip + opts.take)
      : all.slice(skip);
  return sliced as PostListEntry<SectionFrontmatter[S]>[];
}

export async function countSectionPosts(
  section: SectionName,
  opts: Pick<ListPostsOptions, "tag"> = {},
): Promise<number> {
  "use cache";
  // Tag filter or production: must parse to filter accurately.
  if (opts.tag || process.env.NODE_ENV === "production") {
    const all = opts.tag
      ? (await _listAllParsed(section)).filter((p) =>
          p.frontmatter.tags?.includes(opts.tag as string),
        )
      : await _listAllParsed(section);
    return all.length;
  }
  // Cheap path: count files only.
  return (await _listFileEntries(section)).length;
}

export async function listSectionTags(
  section: SectionName,
): Promise<string[]> {
  "use cache";
  const all = await _listAllParsed(section);
  const tags = new Set<string>();
  for (const p of all) {
    for (const t of p.frontmatter.tags ?? []) tags.add(t);
  }
  return Array.from(tags);
}

export type PostMeta<F = RippleFrontmatter> = {
  slug: string;
  frontmatter: F;
  basename: string;
};

export async function loadSectionPostMeta<S extends SectionName>(
  section: S,
  slug: string,
): Promise<PostMeta<SectionFrontmatter[S]> | null> {
  "use cache";
  const entries = await _listFileEntries(section);
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) return null;

  const raw = await readFile(
    path.join(sectionDir(section), entry.file),
    "utf-8",
  );
  const { attributes } = frontMatter<Record<string, unknown>>(raw);
  const frontmatter = SECTIONS[section].schema.assert(
    normalizeAttributes(attributes, entry.dateStr),
  ) as SectionFrontmatter[S];
  const basename = entry.file.replace(/\.mdx$/, "");
  return { slug, frontmatter, basename };
}

const _loadSectionPost = cache(
  async (
    section: SectionName,
    slug: string,
  ): Promise<Post<AnyFrontmatter>> => {
    const meta = await loadSectionPostMeta(section, slug);
    if (!meta) notFound();
    try {
      const mod = await SECTIONS[section].importContent(meta.basename);
      return { slug, frontmatter: meta.frontmatter, Content: mod.default };
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes("Cannot find module") ||
          e.message.includes("ENOENT"))
      ) {
        // this throws
        notFound();
      }
      throw e;
    }
  },
);

export function loadSectionPost<S extends SectionName>(
  section: S,
  slug: string,
): Promise<Post<SectionFrontmatter[S]>> {
  return _loadSectionPost(section, slug) as Promise<
    Post<SectionFrontmatter[S]>
  >;
}
```

Implementation notes:
- If `SECTIONS[section].schema.assert(...)` trips TypeScript on the union of arktype types, cast the schema first: `(SECTIONS[section].schema as typeof RippleFrontmatterSchema | typeof DropletFrontmatterSchema)` or apply `as AnyFrontmatter` to the result. Do not loosen to `any`.
- `readdir(dir, { recursive: true })` returns `string[]` on Node 20+; keep the `paths` type annotation.
- `_loadSectionPost` uses React `cache()` WITHOUT `"use cache"` (its return value contains a component, which is not serializable) — same as today's `loadRipple`.

- [x] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run __tests__/load-section.test.ts`
Expected: PASS, all describes.

- [x] **Step 5: Verify the full suite and lint**

Run: `pnpm exec vitest run && pnpm lint`
Expected: PASS / clean. (`load-post.test.ts` still exists and still passes — both modules coexist until Task 3.)

---

### Task 3: Section wrappers + call-site migration + delete `load-post.ts`

**Files:**
- Create: `src/features/basin/ripples.ts`
- Create: `src/features/basin/droplets.ts`
- Delete: `src/features/basin/load-post.ts`
- Delete: `__tests__/load-post.test.ts` (superseded by `__tests__/load-section.test.ts`)
- Modify: `src/features/basin/types.ts` (remove the temporary `FrontmatterSchema` alias)
- Modify: `src/features/basin/build-feed.ts`
- Modify: `src/features/basin/components/post-list-item.tsx`
- Modify: `src/app/(root)/basin/page.tsx`
- Modify: `src/app/(root)/basin/page/[n]/page.tsx`
- Modify: `src/app/(root)/basin/tags/page.tsx`
- Modify: `src/app/(root)/basin/tags/[tag]/page.tsx`
- Modify: `src/app/(root)/basin/tags/[tag]/page/[n]/page.tsx`
- Modify: `src/app/(root)/basin/[slug]/page.tsx`
- Modify: `src/app/(root)/basin/[slug]/raw/route.ts`

**Interfaces:**
- Consumes: Task 2's `load-section.ts` exports.
- Produces:
  - `ripples.ts`: `listRipples(opts?: ListPostsOptions)`, `countRipples(opts?: Pick<ListPostsOptions, "tag">)`, `listRippleTags()`, `loadRippleMeta(slug: string)`, `loadRipple(slug: string)`.
  - `droplets.ts`: `listDroplets(opts?: ListPostsOptions)`, `countDroplets(opts?: Pick<ListPostsOptions, "tag">)`, `loadDropletMeta(slug: string)`, `loadDroplet(slug: string)`. (Used by Tasks 4–6.)

- [x] **Step 1: Create the wrappers**

`src/features/basin/ripples.ts`:

```ts
import {
  countSectionPosts,
  type ListPostsOptions,
  listSectionPosts,
  listSectionTags,
  loadSectionPost,
  loadSectionPostMeta,
} from "./load-section";

export const listRipples = (opts?: ListPostsOptions) =>
  listSectionPosts("ripples", opts);

export const countRipples = (opts?: Pick<ListPostsOptions, "tag">) =>
  countSectionPosts("ripples", opts);

export const listRippleTags = () => listSectionTags("ripples");

export const loadRippleMeta = (slug: string) =>
  loadSectionPostMeta("ripples", slug);

export const loadRipple = (slug: string) => loadSectionPost("ripples", slug);
```

`src/features/basin/droplets.ts`:

```ts
import {
  countSectionPosts,
  type ListPostsOptions,
  listSectionPosts,
  loadSectionPost,
  loadSectionPostMeta,
} from "./load-section";

export const listDroplets = (opts?: ListPostsOptions) =>
  listSectionPosts("droplets", opts);

export const countDroplets = (opts?: Pick<ListPostsOptions, "tag">) =>
  countSectionPosts("droplets", opts);

export const loadDropletMeta = (slug: string) =>
  loadSectionPostMeta("droplets", slug);

export const loadDroplet = (slug: string) => loadSectionPost("droplets", slug);
```

(No `listDropletTags` — droplet tags are stored but not surfaced, per spec.)

- [x] **Step 2: Migrate every call site**

Import changes only — rendering logic stays identical. In each file replace the `@/features/basin/load-post` import and rename calls:

| File | Change |
|---|---|
| `src/app/(root)/basin/page.tsx` | `import { countRipples, listRipples } from "@/features/basin/ripples";` — `listPosts(` → `listRipples(`, `countPosts(` → `countRipples(` |
| `src/app/(root)/basin/page/[n]/page.tsx` | same renames (3 call sites: two `countPosts`, one `listPosts`) |
| `src/app/(root)/basin/tags/page.tsx` | `import { listRipples } from "@/features/basin/ripples";` — `listPosts()` → `listRipples()` |
| `src/app/(root)/basin/tags/[tag]/page.tsx` | `import { countRipples, listRipples, listRippleTags } from "@/features/basin/ripples";` — plus `listTags()` → `listRippleTags()` |
| `src/app/(root)/basin/tags/[tag]/page/[n]/page.tsx` | same three renames |
| `src/app/(root)/basin/[slug]/page.tsx` | `import { listRipples, loadRipple, loadRippleMeta } from "@/features/basin/ripples";` and `import { AUTHOR_TIMEZONE } from "@/features/basin/load-section";` — `listPosts()` → `listRipples()` |
| `src/features/basin/build-feed.ts` | `import { listRipples } from "./ripples";` — `listPosts()` → `listRipples()` |
| `src/features/basin/components/post-list-item.tsx` | `import { AUTHOR_TIMEZONE } from "../load-section";` |

- [x] **Step 3: Fix the raw route's stale content path (pre-existing bug)**

`src/app/(root)/basin/[slug]/raw/route.ts` still reads from `src/content/…`, which no longer exists — the route 500s on every hit today. While migrating its imports, fix the path via `sectionDir`:

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sectionDir } from "@/features/basin/load-section";
import { listRipples, loadRippleMeta } from "@/features/basin/ripples";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await listRipples();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params;
  const meta = await loadRippleMeta(slug);
  if (!meta)
    return new Response("There is no post here. There was never a post here.", {
      status: 404,
    });
  const raw = await readFile(
    path.join(sectionDir("ripples"), `${meta.basename}.mdx`),
    "utf-8",
  );
  return new Response(raw, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
```

- [x] **Step 4: Delete the superseded module, test, and alias**

- Delete `src/features/basin/load-post.ts`.
- Delete `__tests__/load-post.test.ts`.
- In `src/features/basin/types.ts`, remove the two lines: the `// TOD(task 3)…` comment and `export const FrontmatterSchema = RippleFrontmatterSchema;`.

- [x] **Step 5: Verify no references remain**

Run: `grep -rn "load-post" src __tests__; grep -rnw "listPosts\|countPosts\|listTags\|FrontmatterSchema" src __tests__`
Expected: no output from either command (`-w` word-matching keeps `listSectionPosts` / `RippleFrontmatterSchema` etc. from matching; both greps exiting non-zero with no lines is the pass condition).

- [x] **Step 6: Run suite, lint, typecheck**

Run: `pnpm exec vitest run && pnpm lint && pnpm exec tsc --noEmit`
Expected: all PASS/clean.

- [x] **Step 7: Smoke-test ripples in the browser**

Run: `pnpm dev` (port 6767), then check `http://localhost:6767/basin`, one post page, `http://localhost:6767/basin/tags`, and `http://localhost:6767/basin/<slug>/raw` (raw should now return markdown instead of erroring).
Expected: everything renders as before the refactor; raw route works.

---

### Task 4: Droplets stream page at `/basin/droplets`

**Files:**
- Modify: `src/features/basin/pagination.ts` (add `DROPLETS_PER_PAGE`)
- Create: `src/features/basin/components/droplet-stream-item.tsx`
- Modify: `src/app/(root)/basin/droplets/page.tsx` (replace the UnderConstruction stub)
- Create: `src/basin/droplets/2026/07/2026-07-05-first-drop.mdx` (sample content, `draft: true`)

**Interfaces:**
- Consumes: `listDroplets`/`countDroplets`/`loadDroplet` (Task 3), `makePageInfo`/`PaginationControls` (existing, both already accept a custom page size / `basePath`), `PostTags` from `./post-tag`, `AUTHOR_TIMEZONE` from `../load-section`.
- Produces: `DROPLETS_PER_PAGE = 10`; `DropletStreamItem` — async server component taking `{ droplet: PostListEntry<DropletFrontmatter> }`, rendering the full MDX content inline (also used by Task 5).

- [x] **Step 1: Add the page-size constant**

In `src/features/basin/pagination.ts`, below `POSTS_PER_PAGE`:

```ts
export const DROPLETS_PER_PAGE = 10;
```

- [x] **Step 2: Create the sample droplet**

Create `src/basin/droplets/2026/07/2026-07-05-first-drop.mdx` (draft, so it can never ship to production; it also guarantees the droplets directory exists in git):

```mdx
---
title: first drop
tags: [meta]
draft: true
---

the basin gains a second voice. droplets — smaller, quieter, more often.
```

- [x] **Step 3: Create `DropletStreamItem`**

Create `src/features/basin/components/droplet-stream-item.tsx`:

```tsx
import Link from "next/link";
import { loadDroplet } from "../droplets";
import { AUTHOR_TIMEZONE } from "../load-section";
import type { DropletFrontmatter, PostListEntry } from "../types";
import { PostTags } from "./post-tag";

interface DropletStreamItemProps {
  droplet: PostListEntry<DropletFrontmatter>;
}

export async function DropletStreamItem({ droplet }: DropletStreamItemProps) {
  const { Content, frontmatter } = await loadDroplet(droplet.slug);

  return (
    <article className="rounded-lg p-3">
      <header className="mb-2 flex items-baseline justify-between gap-3">
        {frontmatter.title ? (
          <h2 className="font-heading text-primary text-xl">
            {frontmatter.title}
          </h2>
        ) : null}
        <div className="ml-auto flex flex-col items-end gap-1">
          <Link
            href={`/basin/droplets/${droplet.slug}`}
            className="shrink-0 text-muted-foreground text-xs underline-offset-2 hover:underline"
          >
            <time dateTime={frontmatter.publishedAt}>
              {new Date(frontmatter.publishedAt).toLocaleDateString("en-US", {
                timeZone: AUTHOR_TIMEZONE,
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </Link>
          <PostTags
            tags={[
              ...(frontmatter.tags ?? []),
              ...(frontmatter.draft ? ["draft"] : []),
            ]}
          />
        </div>
      </header>
      <div className="prose max-w-none">
        <Content />
      </div>
    </article>
  );
}
```

- [x] **Step 4: Replace the stub page**

Rewrite `src/app/(root)/basin/droplets/page.tsx`. The `<Title>` block (the letter-by-letter opacity spans and the `Droplet` icon adornment) is kept EXACTLY as it is in the current file — only the `UnderConstruction` block below it is replaced:

```tsx
import { Droplet } from "lucide-react";
import { Separator } from "@/components/atoms/separator";
import { Title } from "@/components/structure/title";
import { DropletStreamItem } from "@/features/basin/components/droplet-stream-item";
import { PaginationControls } from "@/features/basin/components/pagination-controls";
import { countDroplets, listDroplets } from "@/features/basin/droplets";
import { DROPLETS_PER_PAGE, makePageInfo } from "@/features/basin/pagination";

export default async function Page() {
  const [droplets, total] = await Promise.all([
    listDroplets({ take: DROPLETS_PER_PAGE }),
    countDroplets(),
  ]);
  const page = makePageInfo(1, total, DROPLETS_PER_PAGE);

  return (
    <>
      {/* ⬇ existing Title block, unchanged — copy verbatim from the current file */}
      <Title
        containerClassName="group flex w-auto items-center gap-2"
        className="relative -left-6 cursor-default"
        title="humming whispers"
        adornment={
          <Droplet
            className="size-12 rounded-full bg-radial from-transparent to-amber-500/10 text-highlight opacity-10 shadow-amber-900/50 shadow-inner blur-[2px] transition-all duration-500 group-hover:opacity-30 group-hover:blur-none"
            aria-hidden="true"
          />
        }
      >
        {/* …the eight <span> letters exactly as currently written… */}
      </Title>
      {/* ⬆ existing Title block, unchanged */}

      {droplets.length === 0 ? (
        <p className="text-muted-foreground italic">Nothing yet.</p>
      ) : (
        <>
          <section className="space-y-6">
            {droplets.map((droplet) => (
              <DropletStreamItem key={droplet.slug} droplet={droplet} />
            ))}
          </section>
          <Separator className="-mx-2 mt-8 data-[orientation=horizontal]:w-[calc(100%+1rem)] md:-mx-4 md:data-[orientation=horizontal]:w-[calc(100%+2rem)]" />
          <PaginationControls page={page} basePath="/basin/droplets" />
        </>
      )}
    </>
  );
}
```

(The `{/* … */}` markers above are instructions to the implementer, not code to paste — the real file must contain the full existing `<span>` letters. Remove the `UnderConstruction` import; `lucide-react`'s `Droplet` import stays.)

- [x] **Step 5: Verify in the browser**

Run: `pnpm dev`, visit `http://localhost:6767/basin/droplets`.
Note: the proxy gates `/basin/droplets*` behind a valid `reflection` cookie and redirects to `/reflection` otherwise — pass that gate first if redirected.
Expected: the title art renders, followed by the sample droplet — "first drop" heading, date "Jul 5, 2026" linking to `/basin/droplets/first-drop` (404 until Task 6), `meta` and `draft` tags, and the body sentence. No pagination controls (single page).

- [x] **Step 6: Run suite and lint**

Run: `pnpm exec vitest run && pnpm lint`
Expected: PASS / clean.

---

### Task 5: Paginated droplets route `/basin/droplets/page/[n]`

**Files:**
- Create: `src/app/(root)/basin/droplets/page/[n]/page.tsx`
- Create: `src/app/(root)/basin/droplets/page/[n]/not-found.tsx`

**Interfaces:**
- Consumes: `listDroplets`/`countDroplets` (Task 3), `DROPLETS_PER_PAGE`/`makePageInfo` (Task 4), `DropletStreamItem` (Task 4), `PaginationControls`.
- Produces: routes only.

- [x] **Step 1: Create the paginated page**

Create `src/app/(root)/basin/droplets/page/[n]/page.tsx` — the droplets analog of `src/app/(root)/basin/page/[n]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Separator } from "@/components/atoms/separator";
import { DropletStreamItem } from "@/features/basin/components/droplet-stream-item";
import { PaginationControls } from "@/features/basin/components/pagination-controls";
import { countDroplets, listDroplets } from "@/features/basin/droplets";
import { DROPLETS_PER_PAGE, makePageInfo } from "@/features/basin/pagination";

type Props = {
  params: Promise<{ n: string }>;
};

export async function generateStaticParams() {
  const total = await countDroplets();
  const totalPages = Math.max(1, Math.ceil(total / DROPLETS_PER_PAGE));
  // Page 1 lives at /basin/droplets; generate /basin/droplets/page/2, …
  const params = Array.from({ length: totalPages - 1 }, (_, i) => ({
    n: String(i + 2),
  }));

  // Cache Components requires at least one entry. If there's nothing to
  // paginate, return a sentinel that the page below will notFound() on.
  return params.length > 0 ? params : [{ n: "2" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return {
    title: `droplets · page ${n}`,
  };
}

export default async function DropletsPaginatedIndex({ params }: Props) {
  const { n } = await params;
  const pageNumber = Number(n);

  // /basin/droplets/page/1 is not canonical (page 1 lives at /basin/droplets)
  // — 404 it to keep one URL per page. Also reject non-integers and < 2.
  if (!Number.isInteger(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const total = await countDroplets();
  const page = makePageInfo(pageNumber, total, DROPLETS_PER_PAGE);
  if (page.pageNumber !== pageNumber) {
    // Requested page is beyond what exists.
    notFound();
  }

  const droplets = await listDroplets({
    skip: (pageNumber - 1) * DROPLETS_PER_PAGE,
    take: DROPLETS_PER_PAGE,
  });

  return (
    <>
      <h1 className="mb-8 font-heading text-3xl">droplets</h1>
      <section className="space-y-6">
        {droplets.map((droplet) => (
          <DropletStreamItem key={droplet.slug} droplet={droplet} />
        ))}
      </section>
      <Separator className="-mx-2 mt-8 data-[orientation=horizontal]:w-[calc(100%+1rem)] md:-mx-4 md:data-[orientation=horizontal]:w-[calc(100%+2rem)]" />
      <PaginationControls page={page} basePath="/basin/droplets" />
    </>
  );
}
```

- [x] **Step 2: Create the not-found page**

Copy `src/app/(root)/basin/page/[n]/not-found.tsx` to `src/app/(root)/basin/droplets/page/[n]/not-found.tsx` verbatim; if its copy names "basin", adjust wording to "droplets" in the same voice.

- [x] **Step 3: Verify in the browser**

Run: `pnpm dev`, visit `http://localhost:6767/basin/droplets/page/2` and `/basin/droplets/page/1`.
Expected: page 2 404s (only one droplet exists → sentinel notFound) and page 1 404s (non-canonical). To see a real page 2, temporarily duplicate the sample droplet 10+ times with distinct dates/slugs, verify, then delete the copies.

- [x] **Step 4: Run suite and lint**

Run: `pnpm exec vitest run && pnpm lint`
Expected: PASS / clean.

---

### Task 6: Droplet permalink route `/basin/droplets/[slug]`

**Files:**
- Create: `src/app/(root)/basin/droplets/[slug]/layout.tsx`
- Create: `src/app/(root)/basin/droplets/[slug]/page.tsx`

**Interfaces:**
- Consumes: `listDroplets`/`loadDroplet`/`loadDropletMeta` (Task 3), `AUTHOR_TIMEZONE` (Task 2), `Badge` from `@/components/atoms/badge`.
- Produces: routes only.

- [x] **Step 1: Create the layout**

Create `src/app/(root)/basin/droplets/[slug]/layout.tsx` — same article shell as ripple posts:

```tsx
import "@/css/basin.css";

import type { ReactNode } from "react";

export default function DropletLayout({ children }: { children: ReactNode }) {
  return (
    <article className="rounded-lg px-4 pt-4 pb-14 shadow-lg backdrop-blur-lg md:px-6 md:pt-12 md:pb-20">
      {children}
    </article>
  );
}
```

- [x] **Step 2: Create the permalink page**

Create `src/app/(root)/basin/droplets/[slug]/page.tsx` — a simplified ripple post page: date is the fallback title, tags are non-linked badges, no blurb, no entrance script:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/atoms/badge";
import {
  listDroplets,
  loadDroplet,
  loadDropletMeta,
} from "@/features/basin/droplets";
import { AUTHOR_TIMEZONE } from "@/features/basin/load-section";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDropletDate(publishedAt: string): string {
  return new Date(publishedAt).toLocaleDateString("en-US", {
    timeZone: AUTHOR_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  const droplets = await listDroplets();
  // Cache Components requires at least one entry. If no droplets exist yet,
  // return a sentinel that the page below will notFound() on.
  return droplets.length > 0
    ? droplets.map((d) => ({ slug: d.slug }))
    : [{ slug: "_" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = await loadDropletMeta(slug);
  if (!meta) notFound();
  return {
    title:
      meta.frontmatter.title ??
      `droplet · ${formatDropletDate(meta.frontmatter.publishedAt)}`,
  };
}

// The MDX import is the slow await — isolated behind Suspense so the header
// renders from cached metadata immediately, before the body resolves.
async function DropletBody({ slug }: { slug: string }) {
  const { Content } = await loadDroplet(slug);
  return (
    <div className="prose max-w-none">
      <Content />
    </div>
  );
}

export default async function DropletPage({ params }: Props) {
  const { slug } = await params;
  const meta = await loadDropletMeta(slug);
  if (!meta) notFound();
  const { frontmatter } = meta;

  return (
    <>
      <header className="mb-8 border-border border-b pb-6">
        <h1 className="text-3xl leading-tight tracking-tight">
          {frontmatter.title ?? formatDropletDate(frontmatter.publishedAt)}
        </h1>
        <div className="mt-4 flex items-center gap-4 text-muted-foreground text-sm">
          <time dateTime={frontmatter.publishedAt}>
            {formatDropletDate(frontmatter.publishedAt)}
          </time>
          {frontmatter.tags?.length ? (
            <ul className="flex max-w-full flex-wrap items-baseline gap-1">
              {frontmatter.tags.map((tag) => (
                <li key={tag}>
                  <Badge>{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <Suspense>
        <DropletBody slug={slug} />
      </Suspense>
    </>
  );
}
```

Note: `notFound()` falls through to the existing `src/app/(root)/basin/not-found.tsx`; no droplet-specific not-found page is needed.

- [x] **Step 3: Verify in the browser**

Run: `pnpm dev`, visit `http://localhost:6767/basin/droplets/first-drop` (via the date link on the stream) and `http://localhost:6767/basin/droplets/ghost`.
Expected: the permalink renders title "first drop", date, `meta` badge, and body inside the article shell; `ghost` 404s. Also temporarily strip `title:` from the sample droplet and confirm the h1 falls back to "July 5, 2026", then restore it.

- [x] **Step 4: Run suite and lint**

Run: `pnpm exec vitest run && pnpm lint`
Expected: PASS / clean.

---

### Task 7: Final verification

**Files:** none (verification only).

- [x] **Step 1: Full test suite**

Run: `pnpm exec vitest run`
Expected: all files PASS, including `frontmatter.test.ts`, `load-section.test.ts`, `content-paths.test.ts`, `pagination.test.ts`, `build-feed.test.ts`. `load-post.test.ts` no longer exists.

- [x] **Step 2: Lint and typecheck**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: clean.

- [x] **Step 3: Production build**

Run: `pnpm build`
Expected: build succeeds. Confirm the route list includes `/basin/droplets`, `/basin/droplets/page/[n]`, and `/basin/droplets/[slug]`, and that the ripple routes are unchanged. The draft sample droplet must NOT be emitted as a static droplet page (drafts are excluded in production; the sentinel param covers the empty case).

- [x] **Step 4: Report**

Summarize for Ibrahim: what changed, the raw-route path fix (pre-existing bug), the temporary sample droplet (draft-only, safe to replace with real entries), and that all changes are uncommitted for him to review and commit.
