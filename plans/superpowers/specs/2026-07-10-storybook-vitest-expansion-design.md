# Storybook Vitest Addon + Story Expansion — Design

**Date:** 2026-07-10
**Package:** `services/storybook` (`ui-storybook`)

## Goal

Wire up `@storybook/addon-vitest` so stories run as real browser tests, refresh all ~40 existing atom stories, and add stories for the remaining atoms plus `src/components/backgrounds`, `src/components/shaders`, and `src/components/text`.

## Context

- `services/storybook` is a pnpm workspace package running `@storybook/nextjs-vite` (Vite builder) against the **real** app components via the `@` → `src/` alias. Tailwind v4 + the app's `globals.css` + `next/font` are already wired.
- `@storybook/addon-vitest@^10.5.0` is in `package.json` but unwired, and mismatched with the rest of storybook (`10.4.6`).
- Existing stories cover 38 of 41 atoms plus `curved-text` (which lives in `src/components/text`). Titles use an `Atoms/` prefix; format is Playground + variant-grid stories with full argTypes.
- Backgrounds, shaders, and several text components are WebGL-heavy (`ogl`, `three`, `@react-three/fiber`, `postprocessing`).
- `text/hello` is an async server component calling `connection()` from `next/server`.

## Decisions

### 1. Vitest addon: browser-mode integration (Approach A)

The canonical `addon-vitest` setup:

- `vitest.config.ts` in `services/storybook` using the `storybookTest` Vitest plugin, project name `storybook`.
- Browser mode: headless Chromium via Playwright (`@vitest/browser-playwright` or the version-appropriate provider package, `playwright`).
- `.storybook/vitest.setup.ts` applying project annotations (preview decorators, themes) so tests render exactly like the dev server.
- Add `@storybook/addon-vitest` to `addons` in `main.ts`.
- Every story becomes a render smoke test; stories with `play` functions become interaction tests. The Storybook UI testing panel works in dev.

**Rejected alternatives:** portable stories in jsdom (hand-written test files, jsdom flakiness with Base UI focus/popover behavior, no testing panel); `@storybook/test-runner` (previous generation, superseded by the addon).

### 2. Version alignment

Bump all storybook packages (`storybook`, `@storybook/nextjs-vite`, `@storybook/addon-docs`, `@storybook/addon-themes`, `@storybook/addon-vitest`) to a single matching latest 10.x version.

### 3. WebGL stories excluded from vitest

Shader/background/WebGL-text stories get `tags: ["!test"]` so vitest skips them entirely. They exist for visual browsing in the dev server, with controls for their props/uniforms. No smoke tests, no screenshots. (Headless SwiftShader rendering is slow and flaky; not worth it.)

### 4. Sidebar restructure

- `Atoms/*` — unchanged prefix.
- New sections: `Backgrounds/*`, `Shaders/*`, `Text/*`.
- The existing `curved-text` story moves to `Text/CurvedText`.
- Enable autodocs across the board (preview-level `tags: ["autodocs"]`).

### 5. Refresh all existing stories (four axes, per component)

1. **API sync** — audit each story against current component source; fix drifted props/variants, cover newly added variants and sub-components.
2. **Play functions** — add interaction tests to *meaningful* interactive stories (dialog opens on trigger click, select picks an option, form validates, accordion expands, etc.). Not a play function on every story — static variant grids stay render-only.
3. **Docs/controls** — better argTypes and descriptions where lacking; autodocs.
4. **Titles** — consistent hierarchy per §4.

### 6. New stories

- **Atoms (3):** `collapsible`, `date-picker`, `tabs` — full treatment with play functions.
- **Backgrounds (6):** `ascii-hero`, `light-rays`, `magic-rings`, `modifiable-light-rays`, `noise`, `ripple`. `magic-rings` and `ripple` aren't exported from the barrel — import from their files directly.
- **Shaders (7):** `ascii-wave`, `balatro`, `dither`, `evil-eye`, `gradient-blinds`, `pixel-snow`, `prismatic-burst`.
- **Text (5 new + 1 moved):** `circular-text`, `gradient-text-reveal`, `hello`, `loading-text`, `token-stream`, `wave`; `curved-text` story retitled into this section.
- WebGL-dependent stories tagged `!test` per §3.

### 7. `Hello` async RSC

Try Storybook's `experimentalRSC` feature with a shim for `next/server`'s `connection()` (async no-op via Vite alias — only `hello.tsx` imports `next/server`). If it doesn't render cleanly, fall back to a visual-only story that renders the deterministic path (fixed greeting) and note the limitation in the story description. Tagged `!test` either way (random ASCII art output).

### 8. Scripts & CI

- Add `"test": "vitest run"` (and the addon's expected config) to `ui-storybook`.
- **Local-only** — no GitHub Actions changes. CI wiring is a possible follow-up once the suite proves stable.

## Testing strategy

- `pnpm --filter ui-storybook test` runs the full suite headlessly: render smoke tests for every non-`!test` story + interaction tests for stories with play functions.
- Verification of the addon wiring itself: suite runs green, intentionally-broken story fails, testing panel appears in `storybook dev`.

## Error handling / risks

- **Version bump fallout:** storybook 10.x minor bumps occasionally shift addon APIs; verify dev server + build after alignment before touching stories.
- **Base UI portal/focus behavior in headless runs:** popover/dialog play functions must await visibility (`findBy*`) rather than assume synchronous mounting.
- **`user-edits-concurrently`:** Ibrahim may edit the tree mid-run; work stays inside `services/storybook` except for zero expected app-source changes. No app component edits are in scope.
