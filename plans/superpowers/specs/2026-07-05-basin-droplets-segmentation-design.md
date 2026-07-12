# Basin Droplets Segmentation — Design

**Date:** 2026-07-05
**Status:** Approved

## Goal

Segment basin content into two post types with distinct presentation:

- **Ripples** — the existing long-form posts under `src/basin/ripples/`, served at `/basin` (unchanged behavior).
- **Droplets** — a microjournal under `src/basin/droplets/`, served as an inline stream at `/basin/droplets` with per-entry permalinks.

The loader layer currently hardcodes ripples behind generic names (`listPosts`, `countPosts` in `src/features/basin/load-post.ts`); `DROPLET_DIR` constants exist but are unused, and `/basin/droplets` is an under-construction stub.

## Content model

### Droplets

- Location: `src/basin/droplets/YYYY/MM/YYYY-MM-DD-slug.mdx` (folder scaffolding already exists for 2019–2026).
- **Slugs are optional for droplets** (added 2026-07-05, user request): bare `YYYY-MM-DD.mdx` is valid, and the date doubles as the slug (permalink `/basin/droplets/2026-07-05`). When a slug suffix is present it stays the short slug (`2026-07-05-morning.mdx` → `morning`), same as ripples; date-reuse collisions fall under the existing duplicate-slug warning + newest-wins behavior. Ripples still require slugs. Implemented via a `slugOptional` flag: `classifyContentPath(rel, { slugOptional })` accepts a date-only pattern, and the `SECTIONS` registry sets it per section.
- Frontmatter is also entirely optional for droplets: a file with no `---` block parses to empty attributes, and since `publishedAt` derives from the filename, the droplet schema passes with nothing else present.
- `classifyContentPath` (`src/features/basin/content-paths.ts`) validates both `YYYY/` and `YYYY/MM/` placements against the filename date prefix for both sections.
- Frontmatter schema (new, lighter than ripples):
  - `title?: string` — optional; when absent, display falls back to the formatted date.
  - `tags?: string[]` — stored, but NOT surfaced in `/basin/tags` for now.
  - `draft?: boolean` — filtered out in production, same as ripples.
  - `publishedAt` — derived from the filename date prefix (filename always wins), same normalization as ripples.
  - No `blurb`, no `linkTitle`.

### Ripples

Unchanged: `src/basin/ripples/YYYY/YYYY-MM-DD-slug.mdx`, full frontmatter (required `title`, optional `author`/`blurb`/`linkTitle`/`tags`/`draft`).

## Architecture: loader layer

Split `src/features/basin/load-post.ts` into a shared core plus thin per-section wrappers:

### `load-section.ts` (new, generic core)

Generic functions parameterized by section *name* — `listSectionPosts(section, opts)`, `countSectionPosts(section, opts)`, `listSectionTags(section)`, `loadSectionPostMeta(section, slug)`, `loadSectionPost(section, slug)` — where `section` is `"ripples" | "droplets"`. Per-section config (frontmatter schema, MDX import thunk) lives in a module-scope `SECTIONS` registry keyed by name, NOT in a factory closure: Next's `"use cache"` requires arguments and closed-over values to be serializable, so cached functions can only take the section name string and look up schemas/import functions at module scope. The core contains everything currently in `load-post.ts`:

- Recursive enumeration of the section directory, classification via `classifyContentPath`.
- Build failure on invalid placement (folder date contradicting filename date).
- Duplicate-slug warnings.
- Frontmatter parse + normalization (`publishedAt` from filename, `AUTHOR_TIMEZONE`).
- `cache()` / `"use cache"` caching, including the cheap-path (filename-only slicing in dev without tag filter) vs expensive-path (full parse for tag filter or production draft filtering) split.
- `take` / `skip` / `tag` list options.

`AUTHOR_TIMEZONE` moves here; call sites that currently import it from `load-post.ts` import it from `load-section.ts` instead.

Both dynamic import expressions (`import(\`@/basin/ripples/${basename}.mdx\`)`, `import(\`@/basin/droplets/${basename}.mdx\`)`) live in the registry so each keeps a static path prefix for the bundler.

A missing section directory is treated as an empty section (ENOENT → `[]`): git tracks no files under `src/basin/droplets/` yet, so the scaffolding dirs don't survive a fresh clone.

### `ripples.ts` (wrapper)

Thin bindings over the core: `listRipples`, `countRipples`, `listRippleTags`, `loadRippleMeta`, `loadRipple` — each calls the corresponding core function with `"ripples"`.

### `droplets.ts` (wrapper)

Same shape: `listDroplets`, `countDroplets`, `loadDropletMeta`, `loadDroplet`.

### `types.ts`

`FrontmatterSchema` splits into `RippleFrontmatterSchema` (current schema) and `DropletFrontmatterSchema` (title optional, no blurb/linkTitle). `Post` / `PostListEntry` become generic over the frontmatter type (`Post<F>` / `PostListEntry<F>`), with `RipplePost` / `DropletPost` etc. aliases where it aids readability.

### Call-site migration

`load-post.ts` is deleted. Call sites switch to the new modules:

- `src/app/(root)/basin/page.tsx`, `page/[n]/page.tsx` — `listRipples` / `countRipples`.
- `src/app/(root)/basin/tags/**` — `listRippleTags` / `listRipples`.
- `src/app/(root)/basin/[slug]/**` (page, layout, raw route) — `loadRipple` / `loadRippleMeta` / `listRipples`.
- `src/features/basin/build-feed.ts` — `listRipples`. Feed remains ripples-only.

## Routes & UI

### `/basin/droplets` (stream, replaces stub)

Keeps the existing "humming whispers" `Title` treatment. Below it, entries render **inline in full** (microblog style), newest first, `DROPLETS_PER_PAGE = 10` per page. Each entry is a new `DropletStreamItem` component: permalinked date, optional title, MDX content in prose styling. Empty state matches the ripples index ("Nothing yet.").

### `/basin/droplets/page/[n]` (pagination)

Mirrors `/basin/page/[n]`, reusing `makePageInfo` and `PaginationControls` with `basePath="/basin/droplets"` (already supported — page 1 canonicalizes to the base path).

### `/basin/droplets/[slug]` (permalink)

Simplified version of the ripple post page: header shows title, or the formatted date when title is absent; tags render as non-linked badges; no blurb. `generateStaticParams` from `listDroplets`; drafts excluded in production; `notFound()` for unknown slugs.

Route precedence is handled by Next.js: static `droplets` beats `/basin/[slug]`; static `page` beats `/basin/droplets/[slug]`. (A droplet slugged literally `page` would be shadowed — same existing caveat as ripples.)

## Out of scope

- No feed changes: droplets do not appear in RSS/Atom/JSON feeds.
- No droplet tag pages and no droplet tags in `/basin/tags`.
- No changes to ripple presentation or URLs.

## Testing

- Existing `__tests__/content-paths.test.ts`, `pagination.test.ts`, `build-feed.test.ts`, `frontmatter.test.ts` must keep passing.
- Add droplet schema coverage (title-optional validation, rejection of unknown/malformed fields consistent with existing frontmatter tests).
- Add coverage for the section-loader factory if extractable without fs mocking pain; otherwise the schema + path tests plus a build pass suffice.
