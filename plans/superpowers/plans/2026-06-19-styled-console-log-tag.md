# Styled `console` tagged-template logger — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build `src/utils/log.ts` into a tagged-template `console` logger where `%c` placement and arg ordering are automatic and styles are reusable, combinable values.

**Architecture:** Styles are real runtime-branded values (`Style` = a callable carrying a `css` string; `StyledText` = an atomic styled segment). The `l` tag parses a template once into a `(format, positionalArgs)` pair — each `StyledText` slot becomes `%c<text>%c` (style + reset), objects become `%o`, primitives inline as text — then per-level methods emit `console[level](format, ...positional, ...trailing)`.

**Tech Stack:** TypeScript, React `CSSProperties` (types only), Vitest, Biome.

## Global Constraints

- **Browser-only utility.** `%c` styling is for the browser console; do not add server guards (Node's `util.format` ignores `%c` harmlessly). Keep the top-of-file `// NOTE:` comment.
- **Single-letter public API:** exports are `l`, `s`, `c`, `i`. Do NOT rename `l` to `log`.
- **Style aesthetic:** Biome — 2-space indent, double quotes, semicolons. Run `pnpm biome check` on touched files; avoid `any` (use `unknown` / `Record<symbol, unknown>` casts) and avoid empty block statements.
- **`px` coercion** applies ONLY to length properties in the `PX_PROPS` allowlist; never to `fontWeight`/`lineHeight`.
- **Out of scope (do NOT touch):** `src/utils/control-panel/control-context.tsx` (already decoupled to plain `console.log` by the user) and `__tests__/control-panel.test.ts` (owner: user — it may be red against the user's WIP; ignore it and run scoped tests).
- **Test command (scoped):** `pnpm vitest run __tests__/log.test.ts`. Assertions check the exact arguments passed to `console.*` (captured by a spy), independent of how the runtime formats `%c`.
- **Commits:** the user commits manually. Treat the `git commit` steps as checkpoints — run them only if the user opts in during execution.

---

## File Structure

- `src/utils/log.ts` — the whole utility (rewritten). One module: brands + CSS serialization + `s`/`c`/`i` (Task 1), then the `l` tag (Task 2). No consumers exist, so the rewrite is self-contained.
- `__tests__/log.test.ts` — new Vitest suite. Created in Task 1 (serialization/style cases), extended in Task 2 (tag cases).

---

## Task 1: Styles, CSS serialization & the `i()` helper

**Files:**
- Modify (full rewrite, minus the `l` tag): `src/utils/log.ts`
- Test (create): `__tests__/log.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces:
  - `export interface LogCSSProperties { … }` (the existing interface, now exported, body unchanged)
  - `export interface Style { (text: string): StyledText; readonly css: string }`
  - `export interface StyledText { readonly text: string; readonly css: string }`
  - `export function s(...styles: (Style | LogCSSProperties)[]): Style`
  - `export function s(text: string, ...styles: (Style | LogCSSProperties)[]): StyledText`
  - `export const c: (color: CSSProperties["color"]) => Style`
  - `export const i: (svg: string) => string`
  - Internal (module-private), relied on by Task 2: `isStyle(v): v is Style`, the `STYLE`/`STYLED` symbols.

- [x] **Step 1: Write the failing tests**

Create `__tests__/log.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { c, i, s } from "@/utils/log";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("css serialization", () => {
  it("kebab-cases keys, adds px to length props, leaves others unitless", () => {
    const style = s({
      backgroundColor: "red",
      padding: 2,
      fontWeight: 700,
      lineHeight: 1.5,
    });
    expect(style.css).toBe(
      "background-color: red;padding: 2px;font-weight: 700;line-height: 1.5;",
    );
  });

  it("c(color) is shorthand for a color style", () => {
    expect(c("red").css).toBe("color: red;");
  });

  it("Style.toString() returns its css", () => {
    expect(String(c("red"))).toBe("color: red;");
  });
});

describe("combining vs applying styles", () => {
  it("s(...styles) combines left-to-right (later wins via concatenation)", () => {
    const bold = s({ fontWeight: 700 });
    const danger = c("red");
    const loud = s(bold, danger, { textDecoration: "underline" });
    expect(loud.css).toBe(
      "font-weight: 700;color: red;text-decoration: underline;",
    );
  });

  it("s(text, ...styles) applies styles to text → StyledText", () => {
    const styled = s("boom", c("red"), { fontWeight: 700 });
    expect(styled).toMatchObject({
      text: "boom",
      css: "color: red;font-weight: 700;",
    });
  });

  it("calling a style (style(text)) equals s(text, style)", () => {
    const danger = c("red");
    const viaCall = danger("boom");
    const viaApply = s("boom", danger);
    expect(viaCall.text).toBe(viaApply.text);
    expect(viaCall.css).toBe(viaApply.css);
  });
});

describe("i() svg → data url", () => {
  it("URL-encodes the svg (no base64 / Buffer)", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    expect(i(svg)).toBe(
      `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    );
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run __tests__/log.test.ts`
Expected: FAIL — the current `s`/`c`/`i` have the old signatures (`s` returns a plain string, `c` returns a string, `i` uses `Buffer`), so `.css`/`.text` are undefined and the `i()` output differs.

- [x] **Step 3: Rewrite `src/utils/log.ts` (everything except the `l` tag)**

Replace the entire file contents with:

```ts
// NOTE: don't use this on the server. it's meant for in-browser console.log styling

import type { CSSProperties } from "react";

export interface LogCSSProperties {
  // typography
  color?: CSSProperties["color"];
  fontFamily?: CSSProperties["fontFamily"];
  fontSize?: CSSProperties["fontSize"];
  fontWeight?: CSSProperties["fontWeight"];
  fontStyle?: CSSProperties["fontStyle"];
  textDecoration?: CSSProperties["textDecoration"];
  textTransform?: CSSProperties["textTransform"];
  textShadow?: CSSProperties["textShadow"];
  lineHeight?: CSSProperties["lineHeight"];

  // bg
  background?: CSSProperties["background"];
  backgroundColor?: CSSProperties["backgroundColor"];
  backgroundImage?:
    | CSSProperties["backgroundImage"]
    | `url(data:image/${string};base64,${string})`;
  backgroundSize?: CSSProperties["backgroundSize"];
  backgroundRepeat?: CSSProperties["backgroundRepeat"];

  // border
  border?: CSSProperties["border"];
  borderColor?: CSSProperties["borderColor"];
  borderWidth?: CSSProperties["borderWidth"];
  borderStyle?: CSSProperties["borderStyle"];
  borderRadius?: CSSProperties["borderRadius"];
  borderTop?: CSSProperties["borderTop"];
  borderRight?: CSSProperties["borderRight"];
  borderBottom?: CSSProperties["borderBottom"];
  borderLeft?: CSSProperties["borderLeft"];

  // box
  margin?: CSSProperties["margin"];
  marginTop?: CSSProperties["marginTop"];
  marginRight?: CSSProperties["marginRight"];
  marginBottom?: CSSProperties["marginBottom"];
  marginLeft?: CSSProperties["marginLeft"];
  padding?: CSSProperties["padding"];
  paddingTop?: CSSProperties["paddingTop"];
  paddingRight?: CSSProperties["paddingRight"];
  paddingBottom?: CSSProperties["paddingBottom"];
  paddingLeft?: CSSProperties["paddingLeft"];
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  boxShadow?: CSSProperties["boxShadow"];
  cursor?: CSSProperties["cursor"];
  display?: CSSProperties["display"];
  whiteSpace?: CSSProperties["whiteSpace"];
  wordBreak?: CSSProperties["wordBreak"];
  wordSpacing?: CSSProperties["wordSpacing"];
  writingMode?: CSSProperties["writingMode"];
  boxDecorationBreak?: CSSProperties["boxDecorationBreak"];
}

/* ---------- branded style values ---------- */

const STYLE = Symbol("log.style");
const STYLED = Symbol("log.styledText");

/** A reusable style. Call it with text to produce a `StyledText` segment. */
export interface Style {
  (text: string): StyledText;
  readonly css: string;
}

/** An atomic styled segment: text bundled with the css that styles it. */
export interface StyledText {
  readonly text: string;
  readonly css: string;
}

const isStyle = (v: unknown): v is Style =>
  typeof v === "function" && (v as Record<symbol, unknown>)[STYLE] === true;

/* ---------- css serialization ---------- */

// numeric values for these properties are coerced to `<n>px`; all other
// numerics (e.g. fontWeight, lineHeight) pass through unitless.
const PX_PROPS: ReadonlySet<string> = new Set([
  "fontSize",
  "width",
  "height",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "borderWidth",
  "borderRadius",
]);

const toKebab = (key: string) => key.replace(/([A-Z])/g, "-$1").toLowerCase();

const serializeValue = (key: string, value: unknown): string =>
  typeof value === "number" && PX_PROPS.has(key) ? `${value}px` : String(value);

const toLogCSS = (css: LogCSSProperties): string => {
  const entries = Object.entries(css);
  if (entries.length === 0) return "";
  return `${entries
    .map(([k, v]) => `${toKebab(k)}: ${serializeValue(k, v)}`)
    .join(";")};`;
};

/* ---------- factories ---------- */

type StyleInput = Style | LogCSSProperties;

const cssOf = (input: StyleInput): string =>
  isStyle(input) ? input.css : toLogCSS(input);

const makeStyledText = (text: string, css: string): StyledText => {
  const styled = { text, css } as StyledText & Record<symbol, unknown>;
  styled[STYLED] = true;
  return styled;
};

const makeStyle = (css: string): Style => {
  const style = ((text: string) => makeStyledText(text, css)) as Style &
    Record<symbol, unknown> & { css: string; toString: () => string };
  style.css = css;
  style.toString = () => css;
  style[STYLE] = true;
  return style;
};

/* ---------- public api: s, c, i ---------- */

/**
 * Build a reusable style (combine), or apply styles to text (when the first
 * arg is a string) to get an atomic `StyledText` segment. Styles merge
 * left-to-right; later declarations win.
 *
 * @example const danger = s({ color: "red", fontWeight: 700 });
 * @example l`${s("error", danger)} occurred`.error();
 */
export function s(...styles: StyleInput[]): Style;
export function s(text: string, ...styles: StyleInput[]): StyledText;
export function s(
  first: string | StyleInput,
  ...rest: StyleInput[]
): Style | StyledText {
  if (typeof first === "string") {
    return makeStyledText(first, rest.map(cssOf).join(""));
  }
  return makeStyle([first, ...rest].map(cssOf).join(""));
}

/** Shorthand for `s({ color })`. */
export const c = (color: CSSProperties["color"]): Style => s({ color });

/** SVG string → CSS `url(...)` value for use as a `backgroundImage`. */
export const i = (svg: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run __tests__/log.test.ts`
Expected: PASS (all cases in the suite).

Then lint the touched files:
Run: `pnpm biome check src/utils/log.ts __tests__/log.test.ts`
Expected: no errors (run `pnpm biome check --write src/utils/log.ts __tests__/log.test.ts` if only formatting differs).

- [x] **Step 5: Commit** *(checkpoint — only if the user opts in)*

```bash
git add src/utils/log.ts __tests__/log.test.ts
git commit -m "feat(log): branded combinable styles + css serialization"
```

---

## Task 2: The `l` tagged-template logger

**Files:**
- Modify (append the tag + helpers): `src/utils/log.ts`
- Test (extend): `__tests__/log.test.ts`

**Interfaces:**
- Consumes (from Task 1): `isStyle`, the `STYLED` symbol, `Style`, `StyledText`.
- Produces:
  - `export interface LogHolder { log(...a: unknown[]): void; debug(...a: unknown[]): void; info(...a: unknown[]): void; warn(...a: unknown[]): void; error(...a: unknown[]): void }`
  - `export function l(strings: TemplateStringsArray, ...slots: unknown[]): LogHolder`

- [x] **Step 1: Write the failing tests**

Append to `__tests__/log.test.ts` (and add `l` to the existing import: `import { c, i, l, s } from "@/utils/log";`):

```ts
describe("l tag — slot resolution", () => {
  it("emits %c<text>%c for a styled segment and inlines plain string values", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    l`${s("error", { color: "red" })}: could not load ${"x.js"}`.error();
    expect(spy).toHaveBeenCalledWith(
      "%cerror%c: could not load x.js",
      "color: red;",
      "",
    );
  });

  it("renders object slots as %o positional args", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const obj = { a: 1 };
    l`state ${obj} end`.warn();
    expect(spy).toHaveBeenCalledWith("state %o end", obj);
  });

  it("renders null/undefined slots as empty strings", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`a${null}b${undefined}c`.log();
    expect(spy).toHaveBeenCalledWith("abc");
  });

  it("ignores a bare (unapplied) style slot", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`x${c("red")}y`.log();
    expect(spy).toHaveBeenCalledWith("xy");
  });

  it("escapes % in literal text and in string values", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`100% ${"50% off"}`.log();
    expect(spy).toHaveBeenCalledWith("100%% 50%% off");
  });

  it("appends emit-method args after the positional args", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const detail = { prev: 1, value: 2 };
    l`${s("hi", { color: "red" })}`.debug(detail);
    expect(spy).toHaveBeenCalledWith("%chi%c", "color: red;", "", detail);
  });

  it("routes each level to the matching console method", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    l`plain ${1}`.info();
    expect(info).toHaveBeenCalledWith("plain 1");
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run __tests__/log.test.ts`
Expected: FAIL — `l is not a function` / `l(...).error is not a function` (the tag does not exist yet).

- [x] **Step 3: Append the implementation to `src/utils/log.ts`**

Add at the end of the file:

```ts
/* ---------- the l tag ---------- */

type ConsoleLevel = "log" | "debug" | "info" | "warn" | "error";

export interface LogHolder {
  log(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

const isStyledText = (v: unknown): v is StyledText =>
  typeof v === "object" &&
  v !== null &&
  (v as Record<symbol, unknown>)[STYLED] === true;

// `%` is a console format-specifier prefix; double it so literal text and
// string values can't accidentally consume positional args.
const escapePct = (str: string) => str.replace(/%/g, "%%");

const build = (strings: TemplateStringsArray, slots: unknown[]) => {
  let format = "";
  const positional: unknown[] = [];

  for (let idx = 0; idx < strings.length; idx++) {
    format += escapePct(strings[idx]);
    if (idx >= slots.length) continue;

    const slot = slots[idx];

    if (isStyledText(slot)) {
      // %c sets the style, the trailing %c resets it → atomic, no leak
      format += `%c${escapePct(slot.text)}%c`;
      positional.push(slot.css, "");
      continue;
    }
    // a bare style applies to no text, and nullish renders nothing
    if (isStyle(slot) || slot == null) continue;
    if (
      typeof slot === "string" ||
      typeof slot === "number" ||
      typeof slot === "bigint" ||
      typeof slot === "boolean"
    ) {
      format += escapePct(String(slot));
      continue;
    }
    // objects / functions / arrays → inspectable %o in position
    format += "%o";
    positional.push(slot);
  }

  return { format, positional };
};

/**
 * Tagged-template console logger. Wrap text with a style to color it; leave it
 * unwrapped for plain text. `%c` placement and arg order are handled for you.
 *
 * @example l`${c("red")("error")}: ${msg}`.error();
 * @example l`[control:${key}] committed`.debug({ prev, value });
 */
export function l(
  strings: TemplateStringsArray,
  ...slots: unknown[]
): LogHolder {
  const { format, positional } = build(strings, slots);
  const at =
    (level: ConsoleLevel) =>
    (...args: unknown[]) =>
      console[level](format, ...positional, ...args);
  return {
    log: at("log"),
    debug: at("debug"),
    info: at("info"),
    warn: at("warn"),
    error: at("error"),
  };
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run __tests__/log.test.ts`
Expected: PASS (Task 1 + Task 2 cases — the full suite).

Then lint:
Run: `pnpm biome check src/utils/log.ts __tests__/log.test.ts`
Expected: no errors (use `--write` if only formatting differs).

- [x] **Step 5: Commit** *(checkpoint — only if the user opts in)*

```bash
git add src/utils/log.ts __tests__/log.test.ts
git commit -m "feat(log): l tagged-template logger with auto %c + arg ordering"
```

---

## Self-Review (performed during planning)

**Spec coverage:**
- Auto-detect styles vs values, atomic styled segments, no `%c`/arg bookkeeping → Task 2 `build` + Task 2 tests.
- `s` combine/apply overload, callable `Style`, `c` shorthand → Task 1 + tests.
- Real runtime brand (symbols) vs the old compile-time cast → Task 1 (`STYLE`/`STYLED`, `isStyle`/`isStyledText`).
- Slot table (StyledText / bare Style no-op / primitive inline / null→"" / object→`%o`) → Task 2 `build` + a test each.
- `%` escaping, trailing args after positional → Task 2 tests.
- Levels only (`log/debug/info/warn/error`), no options bag, no group/table/time → Task 2 `LogHolder`/`l`.
- CSS serialization: kebab-case, `PX_PROPS` px (not fontWeight/lineHeight), dead brand line removed, `;`-terminated → Task 1 + test.
- `i()` `Buffer`→`encodeURIComponent` → Task 1 + test.
- Control-panel call site + its test → out of scope (already decoupled by user; noted in Global Constraints).
- Remove the self-executing bottom example → handled by Task 1's full rewrite (the new file has no top-level call).

**Placeholder scan:** none — every code/command/test step is concrete.

**Type consistency:** `Style`, `StyledText`, `LogHolder`, `s`/`c`/`i`/`l` signatures and the `STYLE`/`STYLED` symbols are used identically across Task 1 (definition) and Task 2 (consumption). `isStyle` defined Task 1 / consumed Task 2; `isStyledText` defined and consumed Task 2.
