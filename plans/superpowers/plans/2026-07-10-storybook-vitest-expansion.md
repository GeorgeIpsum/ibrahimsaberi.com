# Storybook Vitest Addon + Story Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `@storybook/addon-vitest` (browser mode, headless Chromium) into `services/storybook`, refresh all ~40 existing atom stories with API sync + play functions + docs polish, and add stories for the remaining atoms, backgrounds, shaders, and text components.

**Architecture:** `services/storybook` is a pnpm workspace package (`ui-storybook`) running `@storybook/nextjs-vite` against the real app source via the `@` → `src/` alias. The vitest addon turns every story into a browser render test and every `play` function into an interaction test. WebGL components (`ogl`/`three`-based) are tagged `!test` and exist for visual browsing only.

**Tech Stack:** Storybook 10.5.0 (`@storybook/nextjs-vite`), Vitest 4.1.10 browser mode, `@vitest/browser-playwright` 4.1.10, Playwright (chromium), Tailwind v4, Base UI atoms, React 19.

**Spec:** `plans/superpowers/specs/2026-07-10-storybook-vitest-expansion-design.md`

## Global Constraints

- **NEVER run any git command** (`git add`, `git commit`, `git push`, `git restore`, `git checkout -- <file>`, etc.). Ibrahim owns all gitops and edits the tree concurrently. At the end of each task, list the files you created/modified instead of committing. If you must undo one of *your own* edits, re-edit the file back by hand — never via git.
- **Never revert or "fix" a working-tree change you didn't make.** If a file differs from what you expect and it's not in your task's file list, leave it alone and note it.
- All work stays inside `services/storybook/` — **zero edits to `src/`** (app components are consumed read-only via the `@` alias).
- Package versions are exact: storybook packages `10.5.0`, `vitest`/`@vitest/browser-playwright` `^4.1.10`.
- All commands run from the repo root `/Users/g1n/lib/ibrahimsaberi.com` using `pnpm --filter ui-storybook <cmd>`.
- Formatting: biome, root config, 2-space indent. After editing stories run `pnpm --filter ui-storybook exec biome check --write stories .storybook vitest.config.ts` (drop path args that don't exist yet).
- Story imports: types from `@storybook/nextjs-vite`, test helpers from `storybook/test` (`expect`, `userEvent`, `within`, `waitFor`, `fn`), components via `@/components/...` file paths (not barrels).
- Story format convention (see any existing story, e.g. `services/storybook/stories/button.stories.tsx`): `const meta = { title, component, parameters, args, argTypes } satisfies Meta<typeof X>`, `export default meta`, `type Story = StoryObj<typeof meta>`, a `Playground` story first, then variant-grid stories.
- Title sections: `Atoms/*`, `Backgrounds/*`, `Shaders/*`, `Text/*`.
- WebGL components get `tags: ["!test"]` **in the meta** so vitest skips the whole file: all 7 shaders + `backgrounds/magic-rings` + `text/hello`.

## Play-Function Pattern Library

Reference for Tasks 4–8. Complete, working patterns — adapt names/assertions per component. Base UI portals content to `document.body`, so query portaled content via `within(document.body)` (aliased `screen` below) and **always `await findBy*`** rather than `getBy*` for anything that appears after an interaction.

```tsx
import { expect, userEvent, waitFor, within } from "storybook/test";

// Pattern 1 — overlay opens on trigger click (dialog, alert-dialog, popover, menu, drawer, preview-card, tooltip*)
export const OpensOnClick: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /open/i }));
    const screen = within(document.body);
    await expect(await screen.findByRole("dialog")).toBeVisible();
  },
};
// *tooltip/preview-card open on hover: use `await userEvent.hover(trigger)` instead of click.

// Pattern 2 — select / combobox picks an option
export const SelectsOption: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("combobox"));
    const screen = within(document.body);
    await userEvent.click(await screen.findByRole("option", { name: "Banana" }));
    await waitFor(() => expect(canvas.getByRole("combobox")).toHaveTextContent("Banana"));
  },
};

// Pattern 3 — typing into an input/textarea/number-field
export const TypesValue: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "hello world");
    await expect(input).toHaveValue("hello world");
  },
};

// Pattern 4 — toggle state (checkbox, switch, toggle, radio)
export const Toggles: Story = {
  play: async ({ canvas }) => {
    const box = canvas.getByRole("checkbox");
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};

// Pattern 5 — disclosure (accordion, collapsible, tabs)
export const ExpandsPanel: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /section one/i }));
    await expect(await canvas.findByText(/panel content/i)).toBeVisible();
  },
};

// Pattern 6 — form validation surfaces an error
export const ShowsValidationError: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /submit/i }));
    await expect(await canvas.findByText(/required/i)).toBeVisible();
  },
};
```

Rules of thumb:
- Add play functions only to stories where interaction is the point (one or two per file). Static variant grids stay render-only — the addon smoke-tests those automatically.
- A play story must be deterministic: fixed args, no random/animated end-states in assertions.
- If the existing `Playground` story is the only sensible target, add a dedicated `export const Interaction: Story` instead of mutating `Playground`.

---

### Task 1: Version alignment + dependencies

**Files:**
- Modify: `services/storybook/package.json`

**Interfaces:**
- Produces: a lockstep storybook 10.5.0 install with vitest 4 browser-mode deps available to Task 2.

- [ ] **Step 1: Update `services/storybook/package.json` devDependencies and scripts**

Set these exact values (leave `@tailwindcss/vite`, `@types/*`, `lightningcss`, `next`, `react`, `react-dom`, `vite` untouched):

```json
{
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "storybook build",
    "lint": "biome check",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@storybook/addon-docs": "10.5.0",
    "@storybook/addon-themes": "10.5.0",
    "@storybook/addon-vitest": "10.5.0",
    "@storybook/nextjs-vite": "10.5.0",
    "@vitest/browser-playwright": "^4.1.10",
    "playwright": "^1.57.0",
    "storybook": "10.5.0",
    "vitest": "^4.1.10"
  }
}
```

(`@vitest/browser-playwright` depends on `@vitest/browser` itself — do not add it separately.)

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: resolves cleanly; no peer-dependency errors mentioning storybook or vitest.

- [ ] **Step 3: Install the Playwright chromium binary**

Run: `pnpm --filter ui-storybook exec playwright install chromium`
Expected: downloads (or confirms) chromium; exits 0.

- [ ] **Step 4: Verify the existing storybook still builds after the bump**

Run: `pnpm --filter ui-storybook build`
Expected: `storybook build` completes; output in `services/storybook/storybook-static/`. If it fails, fix forward (10.4→10.5 is a minor bump; check the error against Storybook 10.5 release notes) — do not downgrade.

- [ ] **Step 5: Report changed files** (no git commands — list them for Ibrahim).

---

### Task 2: Wire the vitest addon

**Files:**
- Modify: `services/storybook/.storybook/main.ts`
- Create: `services/storybook/vitest.config.ts`

> Amended 2026-07-10: the originally planned `.storybook/vitest.setup.ts` with `setProjectAnnotations` is intentionally omitted — since Storybook 10.3, `@storybook/addon-vitest` auto-applies preview annotations, and the manual call prints a redundancy warning on every run.

**Interfaces:**
- Consumes: deps from Task 1.
- Produces: `pnpm --filter ui-storybook test` running every story as a browser test; the `storybook` vitest project name; the testing panel in `storybook dev`.

- [ ] **Step 1: Add the addon to `main.ts`**

In `services/storybook/.storybook/main.ts`, change the addons line to:

```ts
  addons: ["@storybook/addon-docs", "@storybook/addon-themes", "@storybook/addon-vitest"],
```

- [ ] **Step 2: Create `services/storybook/vitest.config.ts`**

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          // Loads .storybook/main.ts (including viteFinal: tailwind, `@` alias,
          // react dedupe, lightningcss) so tests build exactly like the dev server.
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "pnpm dev --no-open",
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
```

- [ ] **Step 3: (removed by amendment)** — no `vitest.setup.ts`; the addon auto-applies preview annotations since Storybook 10.3.

- [ ] **Step 4: Run the suite — this is the failing/passing gate for the wiring**

Run: `pnpm --filter ui-storybook test`
Expected: the `storybook` project discovers every `stories/*.stories.tsx` file and all tests PASS (they're render smoke tests at this point). Triage failures individually — a failure here is either wiring (fix in this task) or a genuinely broken story (note it; it gets fixed in its refresh task, Tasks 4–6, unless it blocks the run).

- [ ] **Step 5: Prove failure detection**

Temporarily add a throwing play function to `services/storybook/stories/kbd.stories.tsx`'s `Playground` story:

```tsx
export const Playground: Story = {
  play: async () => {
    throw new Error("vitest wiring canary");
  },
};
```

Run: `pnpm --filter ui-storybook test`
Expected: exactly one FAIL (`kbd` Playground) with "vitest wiring canary".
Then **remove the canary by editing the file back** (no git) and re-run to confirm green.

- [ ] **Step 6: Verify the dev-server testing panel**

Run: `pnpm --filter ui-storybook dev` (background), open http://localhost:6006 — the sidebar shows the Testing Module widget (run-tests button). Stop the server after checking.

- [ ] **Step 7: Lint** — `pnpm --filter ui-storybook exec biome check --write vitest.config.ts .storybook/vitest.setup.ts .storybook/main.ts`

- [ ] **Step 8: Report changed files.**

---

### Task 3: Enable autodocs globally

**Files:**
- Modify: `services/storybook/.storybook/preview.tsx`

**Interfaces:**
- Produces: every story file gets a Docs page without per-file tags; refresh tasks rely on this.

- [ ] **Step 1: Add the tag**

In `services/storybook/.storybook/preview.tsx`, add `tags` to the preview object:

```tsx
const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    // ...existing unchanged
  },
  decorators: [
    // ...existing unchanged
  ],
};
```

- [ ] **Step 2: Verify** — `pnpm --filter ui-storybook dev`, confirm a "Docs" entry appears under e.g. `Atoms/Button` and renders the props table. Stop the server.

- [ ] **Step 3: Run** `pnpm --filter ui-storybook test` — still green (docs tag must not break tests).

- [ ] **Step 4: Report changed files.**

---

### Task 4: Refresh existing stories — display & layout atoms (16 files)

**Files (all Modify, under `services/storybook/stories/`):**
`accordion`, `badge`, `button`, `calendar`, `card`, `empty`, `frame`, `group`, `kbd`, `pagination`, `progress`, `scroll-area`, `separator`, `spinner`, `toggle`, `toggle-group` (`.stories.tsx` each)

**Interfaces:**
- Consumes: pattern library (top of this plan); Tasks 2–3 wiring.
- Produces: nothing downstream — self-contained.

**Per-file refresh checklist (apply to every file in this task's list):**

1. Read the component source at `src/components/atoms/<name>.tsx` **in full**. Diff its exported props/variants/sub-components against what the story exercises. Add stories (or args/argTypes options) for anything missing; remove/fix anything that no longer exists. Do not change the component.
2. Ensure `argTypes` has a control for every meaningful public prop, with `options` arrays derived from the component's actual variant unions (copy the literal values from the source).
3. Add a one-line `parameters: { docs: { description: { component: "…" } } }` to the meta describing what the atom is (one sentence, plain language).
4. Add play functions **only** where interaction is the component's point. In this batch that means: `accordion` (Pattern 5), `pagination` (click page 2 → `aria-current` moves), `toggle`/`toggle-group` (Pattern 4 with role `button` + `aria-pressed`), `calendar` (click a day → selected state). The rest are static/display atoms — no play functions.
5. Keep existing good stories; this is a refresh, not a rewrite.

- [ ] **Step 1:** Apply the checklist to `accordion`, `badge`, `button`, `calendar`.
- [ ] **Step 2:** Run `pnpm --filter ui-storybook exec vitest run stories/accordion.stories.tsx stories/badge.stories.tsx stories/button.stories.tsx stories/calendar.stories.tsx` (vitest accepts file-path filters). Expected: PASS.
- [ ] **Step 3:** Apply the checklist to `card`, `empty`, `frame`, `group`, `kbd`, `pagination`.
- [ ] **Step 4:** Apply the checklist to `progress`, `scroll-area`, `separator`, `spinner`, `toggle`, `toggle-group`.
- [ ] **Step 5:** Full run: `pnpm --filter ui-storybook test` → PASS. Lint: `pnpm --filter ui-storybook exec biome check --write stories`.
- [ ] **Step 6:** Report changed files.

---

### Task 5: Refresh existing stories — form atoms (15 files)

**Files (all Modify, under `services/storybook/stories/`):**
`checkbox`, `checkbox-group`, `combobox`, `field`, `fieldset`, `form`, `input`, `input-group`, `label`, `number-field`, `radio-group`, `select`, `slider`, `switch`, `textarea` (`.stories.tsx` each)

**Interfaces:** same as Task 4.

Apply the Task 4 per-file checklist. Play-function targets in this batch:
- `checkbox`, `checkbox-group`, `radio-group`, `switch` → Pattern 4 (roles: `checkbox`, `radio`, `switch`).
- `select`, `combobox` → Pattern 2.
- `input`, `textarea`, `number-field` → Pattern 3 (number-field: role `textbox`, type digits, assert value; also click the increment button and assert).
- `form` → Pattern 6 (submit empty → error visible).
- `slider` → keyboard interaction: focus the slider, `await userEvent.keyboard("{ArrowRight}")`, assert `aria-valuenow` increased.
- `field`, `fieldset`, `input-group`, `label` → structural, no play functions.

- [ ] **Step 1:** Apply checklist to `checkbox`, `checkbox-group`, `radio-group`, `switch`, `slider`.
- [ ] **Step 2:** Apply checklist to `select`, `combobox`, `number-field`.
- [ ] **Step 3:** Apply checklist to `input`, `textarea`, `form`, `field`, `fieldset`, `input-group`, `label`.
- [ ] **Step 4:** Full run: `pnpm --filter ui-storybook test` → PASS. Lint stories.
- [ ] **Step 5:** Report changed files.

---

### Task 6: Refresh existing stories — overlay atoms (8 files)

**Files (all Modify, under `services/storybook/stories/`):**
`alert-dialog`, `dialog`, `drawer`, `menu`, `popover`, `preview-card`, `toast`, `tooltip` (`.stories.tsx` each)

**Interfaces:** same as Task 4.

Apply the Task 4 per-file checklist. Every file in this batch gets a play function — overlays are pure interaction:
- `dialog`, `alert-dialog`, `drawer`, `popover`, `menu` → Pattern 1 (roles: `dialog` for the first three, `dialog`/`menu` for popover/menu). For `menu`, also click a menu item and assert the menu closes (`waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())`).
- `tooltip`, `preview-card` → Pattern 1 hover variant (`userEvent.hover`; role `tooltip` / find by content).
- `toast` → click the trigger button, then `await within(document.body).findByText(<toast title>)`.

Portal caveat (repeat of the global rule because this batch lives or dies by it): overlay content mounts in `document.body`, not the canvas — query with `within(document.body)` and `findBy*`.

- [ ] **Step 1:** Apply checklist to `dialog`, `alert-dialog`, `drawer`, `popover`.
- [ ] **Step 2:** Apply checklist to `menu`, `tooltip`, `preview-card`, `toast`.
- [ ] **Step 3:** Full run: `pnpm --filter ui-storybook test` → PASS. Lint stories.
- [ ] **Step 4:** Report changed files.

---

### Task 7: New atom stories — collapsible, tabs, date-picker

**Files:**
- Create: `services/storybook/stories/collapsible.stories.tsx`
- Create: `services/storybook/stories/tabs.stories.tsx`
- Create: `services/storybook/stories/date-picker.stories.tsx`

**Interfaces:**
- Consumes: component exports —
  - `@/components/atoms/collapsible`: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` (compound, Base UI).
  - `@/components/atoms/tabs`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`; `TabsVariant = "default" | "underline"` (variant prop on `TabsList`— read the source to confirm which component takes `variant`).
  - `@/components/atoms/date-picker`: `DatePicker` (props: read `DatePickerProps` at `src/components/atoms/date-picker.tsx:74`), `DateRangePicker` (`:163`).
- Produces: nothing downstream.

- [ ] **Step 1: Read all three component sources in full** (`src/components/atoms/{collapsible,tabs,date-picker}.tsx`) plus the existing `calendar.stories.tsx` (date-picker builds on calendar; reuse its arg conventions).

- [ ] **Step 2: Write `collapsible.stories.tsx`** — title `Atoms/Collapsible`, compound render (trigger + content), `Playground` story, and an `Interaction` story using Pattern 5 (click trigger → content visible → click again → hidden). Complete skeleton:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/atoms/collapsible";

const meta = {
  title: "Atoms/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
    docs: { description: { component: "Disclosure that toggles a content panel." } },
  },
  render: (args) => (
    <Collapsible {...args} className="w-72">
      <CollapsibleTrigger>Show details</CollapsibleTrigger>
      <CollapsibleContent>
        <p className="text-muted-foreground text-sm">Hidden until expanded.</p>
      </CollapsibleContent>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Interaction: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: /show details/i });
    await userEvent.click(trigger);
    await expect(await canvas.findByText(/hidden until expanded/i)).toBeVisible();
    await userEvent.click(trigger);
    await waitFor(() =>
      expect(canvas.queryByText(/hidden until expanded/i)).not.toBeVisible(),
    );
  },
};
```

Adjust trigger markup/props to whatever the component source actually exposes (e.g. if `CollapsibleTrigger` renders its own button styling props).

- [ ] **Step 3: Write `tabs.stories.tsx`** — title `Atoms/Tabs`, `Playground` with 3 tabs, a `Variants` story rendering both `TabsVariant` values (`"default"`, `"underline"`), and an `Interaction` story: click the second tab, assert its panel text is visible and the first panel's isn't (Pattern 5; roles `tab` / `tabpanel`).

- [ ] **Step 4: Write `date-picker.stories.tsx`** — title `Atoms/DatePicker`. Stories: `Playground` (uncontrolled `DatePicker`), `Range` (`DateRangePicker`), and an `Interaction` story: click the trigger to open the popover calendar (portaled — `within(document.body)`), click a day button, assert the trigger label updates. Use fixed month/`defaultMonth` args so day names are deterministic — no `new Date()`-dependent assertions on specific dates; assert on the *selected* state (`aria-selected`) instead of formatted text if the label includes the current year.

- [ ] **Step 5:** `pnpm --filter ui-storybook test` → PASS (three new files included). Lint stories.
- [ ] **Step 6:** Report changed files.

---

### Task 8: Text stories (5 new files + curved-text touch-up)

**Files:**
- Create: `services/storybook/stories/circular-text.stories.tsx`
- Create: `services/storybook/stories/gradient-text-reveal.stories.tsx`
- Create: `services/storybook/stories/loading-text.stories.tsx`
- Create: `services/storybook/stories/token-stream.stories.tsx`
- Create: `services/storybook/stories/wave.stories.tsx`
- Modify: `services/storybook/stories/curved-text.stories.tsx` (apply Task 4 checklist only — already titled `Text/CurvedText`)

**Interfaces:**
- Consumes (import each from its file, e.g. `@/components/text/circular-text`):
  - `CircularText` — props: `text` (required), `size?`, `spinDuration?`, `onHover?: "slowDown" | "speedUp" | "pause" | "goBonkers"`, `className?`, `textClassName?`.
  - `GradientTextReveal` — props: `text: string | string[]` (required), `colors?: string[]`, `textColor?`, `duration?`, plus motion span props. Uses `motion/react` + `useInView`.
  - `LoadingText` — props: `className?`, `interval?`, `noEllipsis?`.
  - `TokenStream` — props: extends `span` props + `UseTokenStreamOptions` (read `src/components/text/token-stream.tsx` for the streaming options: text, speed, etc.) + `hideCaret?`.
  - `Wave` — props: `text` (required), `animateOnHover?`, `delay?`, `ebb?`, `flow?`, `colors?`, `className?`, `style?`.
- Produces: nothing downstream.

All five are DOM/CSS/motion components — **no `!test` tags**; they stay in the vitest run as render smoke tests.

- [ ] **Step 1:** Read all five component sources in full.
- [ ] **Step 2:** Write the five story files. Titles `Text/CircularText`, `Text/GradientTextReveal`, `Text/LoadingText`, `Text/TokenStream`, `Text/Wave`. Each: meta with docs description, argTypes with controls for every prop above (`onHover` → select control with the four literals; `colors` → object control), `Playground` story, plus one variant story where the component has meaningful modes (`CircularText` onHover modes grid, `Wave` with/without `animateOnHover`, `TokenStream` with `hideCaret`). Animated components: no play-function assertions on animation end-states; one exception — `TokenStream` may assert its full text eventually appears via `waitFor` with a generous timeout **only if** the stream is deterministic; otherwise skip the play function.
- [ ] **Step 3:** Apply the Task 4 refresh checklist to `curved-text.stories.tsx`.
- [ ] **Step 4:** `pnpm --filter ui-storybook test` → PASS. Lint stories.
- [ ] **Step 5:** Report changed files.

---

### Task 9: Backgrounds stories (6 files)

**Files:**
- Create: `services/storybook/stories/ascii-hero.stories.tsx`
- Create: `services/storybook/stories/light-rays.stories.tsx`
- Create: `services/storybook/stories/magic-rings.stories.tsx`
- Create: `services/storybook/stories/modifiable-light-rays.stories.tsx`
- Create: `services/storybook/stories/noise.stories.tsx`
- Create: `services/storybook/stories/ripple.stories.tsx`

**Interfaces:**
- Consumes (`magic-rings` and `ripple` are **not** in the barrel — import from their files):
  - `AsciiHero` (`@/components/backgrounds/ascii-hero`) — `variant?: "panel" | "bare"` + `UseAsciiFieldOptions` (read the source for the field options) + div props. Canvas-2D, **testable** (no tag).
  - `LightRays` (`@/components/backgrounds/light-rays`) — `count?`, `color?`, `blur?`, `speed?`, `length?`. motion/CSS, testable.
  - `MagicRings` (`@/components/backgrounds/magic-rings`) — 20+ numeric props (`color`, `colorTwo`, `speed`, `ringCount`, `attenuation`, `lineThickness`, `baseRadius`, `radiusStep`, `scaleRate`, `opacity`, `blur`, `noiseAmount`, `rotation`, `ringGap`, `fadeIn`, `fadeOut`, `followMouse`, `mouseInfluence`, `hoverScale`, `parallax`, `clickBurst`). **WebGL (`three`) → `tags: ["!test"]`**.
  - `ModifiableLightRays` (`@/components/backgrounds/modifiable-light-rays`) — `LightRaysProps` minus `color`, plus `r? g? b? a?` numbers. Testable.
  - `NoiseTexture` (`@/components/backgrounds/noise`) — `frequency?`, `octaves?`, `slope?`, `noiseOpacity?` + svg props. SVG, testable.
  - `Ripple` (`@/components/backgrounds/ripple`) — `mainCircleSize?`, `mainCircleOpacity?`, `numCircles?` + div props. CSS, testable.
- Produces: the sized-container decorator pattern reused by Task 10.

Backgrounds render as layers — every story in this task uses a **sized container decorator** in the meta so there's something to see:

```tsx
decorators: [
  (Story) => (
    <div className="relative h-[480px] w-[720px] overflow-hidden rounded-lg border bg-background">
      <Story />
    </div>
  ),
],
parameters: { layout: "centered" },
```

- [ ] **Step 1:** Read all six component sources (skim the 758-line `ascii-hero.tsx` for its options interface + variant behavior rather than line-by-line).
- [ ] **Step 2:** Write `noise`, `ripple`, `light-rays`, `modifiable-light-rays` stories — titles `Backgrounds/<Name>`, sized-container decorator, argTypes with number/color controls for every prop listed above, `Playground` story each. No play functions (visual components).
- [ ] **Step 3:** Write `ascii-hero` stories — `Playground` (variant `"panel"`) and `Bare` (variant `"bare"`, absolutely-positioned inside the container).
- [ ] **Step 4:** Write `magic-rings` stories — meta includes `tags: ["!test"]`; `Playground` with the most visually representative defaults; a `Calm`/`Chaotic` pair showcasing opposite prop extremes.
- [ ] **Step 5:** `pnpm --filter ui-storybook test` → PASS, and the output must show `magic-rings` **skipped/not present** (that's the `!test` tag working). Then `pnpm --filter ui-storybook dev` and visually confirm each of the six renders (WebGL included). Stop the server. Lint stories.
- [ ] **Step 6:** Report changed files.

---

### Task 10: Shaders stories (7 files, all `!test`)

**Files:**
- Create: `services/storybook/stories/ascii-wave.stories.tsx`
- Create: `services/storybook/stories/balatro.stories.tsx`
- Create: `services/storybook/stories/dither.stories.tsx`
- Create: `services/storybook/stories/evil-eye.stories.tsx`
- Create: `services/storybook/stories/gradient-blinds.stories.tsx`
- Create: `services/storybook/stories/pixel-snow.stories.tsx`
- Create: `services/storybook/stories/prismatic-burst.stories.tsx`

**Interfaces:**
- Consumes (import each from its file under `@/components/shaders/`; read each source for the exported component name — some export defaults or named wrappers around the listed props):
  - `ascii-wave` — `text?`, `asciiFontSize?`, `textFontSize?`, `textColor?`, `planeBaseHeight?`, `enableWaves?`.
  - `balatro` — `spinRotation?`, `spinSpeed?`, `offset?: [number, number]`, `color1/2/3?`, `contrast?`, `lighting?`, `spinAmount?`, `pixelFilter?`, `spinEase?`, `isRotate?`, `mouseInteraction?`.
  - `dither` — `waveSpeed?`, `waveFrequency?`, `waveAmplitude?`, `waveColor?: [number, number, number]`, `colorNum?`, `pixelSize?`, `disableAnimation?`, `enableMouseInteraction?`, `mouseRadius?`.
  - `evil-eye` — `eyeColor?`, `intensity?`, `pupilSize?`, `irisWidth?`, `glowIntensity?`, `scale?`, `noiseScale?`, `pupilFollow?`, `flameSpeed?`, `backgroundColor?`.
  - `gradient-blinds` — `gradientColors?: string[]`, `angle?`, `noise?`, `blindCount?`, `blindMinWidth?`, `mouseDampening?`, `mirrorGradient?`, `spotlight{Radius,Softness,Opacity}?`, `distortAmount?`, `shineDirection?: "left" | "right"`, `mixBlendMode?`, `dpr?`, `paused?`, `className?`.
  - `pixel-snow` — `color?`, `flakeSize?`, `minFlakeSize?`, `pixelResolution?`, `speed?`, `depthFade?`, `farPlane?`, `brightness?`, `gamma?`, `density?`, `variant?: "square" | "round" | "snowflake"`, `direction?`.
  - `prismatic-burst` — `intensity?`, `speed?`, `animationType?`, `colors?: string[]`, `distort?`, `paused?`, `offset?`, `hoverDampness?`, `rayCount?`, `mixBlendMode?`.
- Produces: nothing downstream.

Every meta in this task: title `Shaders/<Name>`, `tags: ["!test"]`, the Task 9 sized-container decorator, argTypes covering all props above (tuples like `waveColor` → `control: "object"`), a `Playground` story, and one alternate-mood story where props allow (e.g. `PixelSnow` `variant` grid via three stories or a select control; `Balatro` with `isRotate: true`).

- [ ] **Step 1:** Read each shader source enough to get the exported component name and default values (copy defaults into `args` so Playground looks right immediately).
- [ ] **Step 2:** Write `ascii-wave`, `balatro`, `dither`, `evil-eye` stories.
- [ ] **Step 3:** Write `gradient-blinds`, `pixel-snow`, `prismatic-burst` stories.
- [ ] **Step 4:** `pnpm --filter ui-storybook test` → PASS with **zero** shader tests executed (all skipped via `!test`). `pnpm --filter ui-storybook dev`: visually confirm all seven render and controls affect them. Stop the server. Lint stories.
- [ ] **Step 5:** Report changed files.

---

### Task 11: `Hello` RSC story

**Files:**
- Modify: `services/storybook/.storybook/main.ts`
- Create: `services/storybook/.storybook/next-server-mock.ts`
- Create: `services/storybook/stories/hello.stories.tsx`

**Interfaces:**
- Consumes: `Hello` from `@/components/text/hello` — props `{ default?: string }` (a fixed greeting string; omitting it picks a random greeting). Internally: async RSC awaiting `connection()` from `next/server`, wrapped in `Suspense`.
- Produces: nothing downstream.

- [ ] **Step 1: Create the `next/server` shim** at `services/storybook/.storybook/next-server-mock.ts`:

```ts
// Browser stand-in for `next/server` — only what src/components/text/hello.tsx
// imports. `connection()` just signals "dynamic render"; resolving immediately
// is the correct client-side semantic.
export async function connection(): Promise<void> {}
```

- [ ] **Step 2: Wire it in `main.ts`** — add the RSC feature flag and the alias:

```ts
const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-themes", "@storybook/addon-vitest"],
  features: { experimentalRSC: true },
  viteFinal: async (cfg) => {
    // ...inside the existing mergeConfig call, extend resolve.alias:
    //   alias: {
    //     "@": srcDir,
    //     "next/server": resolve(import.meta.dirname, "next-server-mock.ts"),
    //   },
  },
};
```

(Show the real edit, not the comment — extend the existing `resolve.alias` object in place.)

- [ ] **Step 3: Write `hello.stories.tsx`** — title `Text/Hello`, `tags: ["!test"]` (random greeting + ASCII art = nondeterministic), docs description noting it's an async server component rendered via `experimentalRSC` with a shimmed `connection()`. Stories: `Playground` (no args → random greeting), `Fixed` (`args: { default: "Hello, Storybook" }`).

- [ ] **Step 4: Verify** — `pnpm --filter ui-storybook dev`: `Text/Hello` renders the Title with ASCII art (may flash the Suspense fallback first). **Fallback if it will not render** (RSC emulation fights the async component): delete `hello.stories.tsx`'s render of `Hello` and instead render the component's deterministic path — import `Title` from `@/components/structure/title` and a greeting from `@/components/text/hello/hello.greetings`, mirroring `hello.tsx`'s JSX; keep the docs description honest about the substitution. Keep the `experimentalRSC` flag only if `Hello` itself renders; remove flag + shim if falling back.

- [ ] **Step 5:** `pnpm --filter ui-storybook test` → PASS (hello skipped); `pnpm --filter ui-storybook build` → succeeds. Lint.
- [ ] **Step 6:** Report changed files.

---

### Task 12: README + final verification

**Files:**
- Modify: `services/storybook/README.md`
- Modify: `services/storybook/package.json` (description only)

**Interfaces:** none — final gate.

- [ ] **Step 1: Update README** — it currently claims atoms-only. Update: scope line ("UI atoms plus the backgrounds, shaders and text components"), a **Testing** section documenting `pnpm --filter ui-storybook test` / `test:watch`, the vitest addon + browser mode + one-time `playwright install chromium` requirement, the `!test` tag convention for WebGL stories, and the sidebar sections (`Atoms/`, `Backgrounds/`, `Shaders/`, `Text/`). Update `package.json` `description` to match the wider scope.

- [ ] **Step 2: Full verification gate** (run all; all must pass):

```
pnpm --filter ui-storybook lint          # biome clean
pnpm --filter ui-storybook test          # full suite green; WebGL + hello skipped
pnpm --filter ui-storybook build         # static build succeeds
```

Expected counts: story files = 40 existing + 3 atoms + 5 text + 6 backgrounds + 7 shaders + 1 hello = **62**; vitest runs 53 of them (62 − 8 `!test` WebGL − 1 hello).

- [ ] **Step 3:** `pnpm --filter ui-storybook dev` — spot-check one story per section renders (Atoms/Button, Backgrounds/Ripple, Shaders/PixelSnow, Text/Wave, Text/Hello) in both themes via the toolbar toggle. Stop the server.

- [ ] **Step 4: Report** the complete changed-file list for Ibrahim to review and commit. **No git commands.**
