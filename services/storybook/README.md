# ui-storybook

A Storybook workshop for the UI atoms in [`src/components/atoms`](../../src/components/atoms).

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

## Stories

One `*.stories.tsx` per atom lives in [`stories/`](stories), each exercising the
component's variants, sizes and states with interactive controls.
