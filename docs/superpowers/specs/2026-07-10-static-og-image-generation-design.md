# Static OG image generation

Date: 2026-07-10
Status: approved

## Problem

Each `opengraph-image.tsx` file convention route is a separate serverless
function on Vercel bundling `next/og` (satori + resvg wasm, ~22MB traced per
function). Going from 2 to 9 OG routes added ~30s to Vercel builds. Under
`cacheComponents` on Next 16.2.x these routes can never be statically
prerendered (verified: `"use cache"` fails Flight serialization on
`ImageResponse`, cached-bytes variant times out during cache-fill; the fix
mechanism only ships in 16.3 previews).

## Decision

Pre-generate all static OG images at build time with a plain-node script and
serve them from `public/og/`. Only `/pasta/[noodle]/opengraph-image.tsx`
(dynamic per-param) keeps the file convention and `createOgImage`.

## Components

### `.og-image.rc.json` (repo root)

```jsonc
{
  "outDir": "public/og",
  "images": [
    { "output": "home.png", "template": "home" },
    {
      "output": "reflection.png",
      "title": [
        { "text": "WHOIS" },
        { "text": "i", "fontWeight": 800, "color": "#FFFFEE" }
      ],
      "subtitle": "look inwards",
      "icon": "waveCircle",
      "backgroundColor": "#461901",
      "color": "#fffbeb"
    },
    { "output": "fm.png", "title": "99.7 fm", "subtitle": "the peach", "icon": "peach" }
    // ... hsab, now-playing, speedtest, viddles, pasta
  ]
}
```

- `template`: `"page"` (default; mirrors `createOgImage`) or `"home"` (mirrors
  the root `opengraph-image.tsx` layout).
- `title`: string, or span array `{ text, fontWeight?, color? }` for
  mixed-style titles.
- `icon`: an `@lucide/lab` export name, resolved dynamically. Unknown name =
  hard error.
- `backgroundColor` / `color`: optional overrides, same defaults as
  `createOgImage`.

### `.scripts/generate-og-images.mjs`

Plain node ESM, zero new dependencies. Imports `ImageResponse` from `next/og`
(satori + resvg under the hood) and `@lucide/lab` from the repo's
node_modules. Element trees are plain objects (`{ type, props }`), which
satori accepts identically to JSX — the two templates reproduce the existing
routes' trees pixel-for-pixel. Fonts loaded once: Platypi Light 400, Medium
500, Bold 600 (weights 300/800 in the trees resolve to nearest, matching
current route behavior). Fails loudly (exit 1) on unknown icon, missing font,
or malformed config: a broken OG image should break the build.

### Wiring

- `package.json`: `"build:og": "node .scripts/generate-og-images.mjs"`, and
  `"build"` becomes `build:packages && build:og && next build`.
- `public/og/` is gitignored; images regenerate on every deploy (~3s total).
- Each covered page exports `openGraph.images` (+ `twitter.images`) pointing
  at `/og/<name>.png` with the old route's `alt`, size 1200x630.
  `metadataBase` in the root layout makes the relative URLs absolute. The root
  layout gets `home.png` as the site-wide default (nearest `openGraph` wins,
  same semantics as the file convention).
- The 9 static `opengraph-image.tsx` files are deleted (root, reflection, fm,
  hsab, now-playing, speedtest, viddles, and both pasta copies).
  `create-og-image.tsx` stays for `[noodle]`.

## Not doing

- Pre-generating the ~110 per-noodle pasta images (stays a single dynamic
  function).
- Deduplicating the template trees between the script and
  `create-og-image.tsx` (~60 lines, consciously duplicated; cross-referenced
  by comments).
- New deps (`satori`, `@resvg/resvg-js`, `tsx`) — `next/og` already vendors
  everything needed.

## Verification

Generator runs clean and every PNG is visually inspected; `pnpm run build`
passes with no `opengraph-image` routes in the output except
`/pasta/[noodle]/opengraph-image`; `pnpm test` and typecheck stay green.
