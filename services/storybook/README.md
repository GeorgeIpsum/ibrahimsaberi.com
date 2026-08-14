# ui-storybook

A Storybook workshop for the UI atoms plus the backgrounds, shaders and text
components in [`src/components`](../../src/components) (`atoms/`,
`backgrounds/`, `shaders/`, `text/`).

It runs as its own pnpm workspace package but renders the **real** components
from the app — nothing is copied. Stories import atoms through the same `@/*`
alias the app uses, and the preview loads the app's actual
[`globals.css`](../../src/css/globals.css) and [`next/font`](../../src/css/font.ts)
setup so everything matches production.

## Usage

```bash
pnpm --filter ui-storybook dev     # dev server on http://localhost:6006
pnpm --filter ui-storybook build   # static build to storybook-static/
```

## Testing

Stories double as render-smoke tests via the
[`@storybook/addon-vitest`](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)
browser-mode integration: each story mounts in a real headless Chromium tab
(via `@vitest/browser-playwright`) and its `play` function (if any) runs
against the real DOM.

```bash
pnpm --filter ui-storybook test         # run once (vitest run)
pnpm --filter ui-storybook test:watch   # watch mode (vitest)
```

One-time setup — the browser-mode runner needs its own Chromium binary:

```bash
pnpm --filter ui-storybook exec playwright install chromium
```

Stories tagged `["!test"]` are excluded from the vitest sweep — that's every
WebGL/`ogl`-backed `Shaders/*` and `Backgrounds/*` story (no reliable GPU context in headless Chromium) plus `Text/Hello` (an async RSC story, exercised only through the browser
preview, not the smoke-test runner).

## How it's wired

- **Framework** — [`@storybook/nextjs-vite`](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)
  (Vite builder). Handles `next/font` and `"use client"` atoms natively.
- **Tailwind v4** — `@tailwindcss/vite` plus
  [`.storybook/tailwind.css`](.storybook/tailwind.css), which re-imports the
  app stylesheet and adds `@source` globs pointing back at `src/`.
- **Theming** — `@storybook/addon-themes` toggles `data-theme` (`light`/`dark`)
  on `<html>` from the toolbar, matching the app's `:root[data-theme="…"]`
  tokens.
- **Component resolution** — `viteFinal` aliases `@` → repo `src` and dedupes
  `react`/`react-dom`/`@base-ui/react` to a single instance.
- **RSC preview** — `features.experimentalRSC` in `.storybook/main.ts` lets
  `Text/Hello` (an async server component awaiting `next/server`'s
  `connection()`) render directly in the browser preview. `viteFinal` aliases
  `next/server` to [`.storybook/next-server-mock.ts`](.storybook/next-server-mock.ts),
  a same-signature browser stub, so the RSC preview doesn't pull in Next's
  server runtime.
- **Vitest addon** — [`vitest.config.ts`](vitest.config.ts) wires
  `@storybook/addon-vitest`'s `storybookTest` plugin against
  `.storybook/main.ts` (so tests build exactly like the dev server) with a
  `browser: { provider: playwright(), instances: [{ browser: "chromium" }] }`
  project. Preview annotations (theme/font decorators) are auto-applied by
  the addon since Storybook 10.3 — no separate `vitest.setup.ts` needed.

## Stories

One `*.stories.tsx` per component lives in [`stories/`](stories), each
exercising the component's variants, sizes and states with interactive
controls. The sidebar groups them into `Atoms/`, `Backgrounds/`, `Shaders/`
and `Text/` sections, matching `src/components/`.
