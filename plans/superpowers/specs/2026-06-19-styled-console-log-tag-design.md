# Styled `console` tagged-template logger — design

**Date:** 2026-06-19
**File:** `src/utils/log.ts` (browser-only — `%c` console styling)
**Status:** approved design, pending implementation plan

## Goal

A tagged-template logger that styles `console` output without the three pains of
raw `%c`:

1. Manually prefixing each styled section with `%c`.
2. Tracking which trailing argument lines up with which `%c`.
3. Defining, reusing, separating, and combining styles.

The tag parses the template **once**; the returned per-level methods build a
single `console` call, emitting `%c` automatically and lining up the style
strings as console args in the correct order.

Mental model: **styled text is an atomic token** that carries its own style and
auto-resets after itself. There is no persistent "current style" to reason
about — *wrapped = styled, unwrapped = plain.* This deliberately avoids raw
`%c`'s "style leaks rightward until the next `%c`" ambiguity.

## Public API (single-letter family: `l` `s` `c` `i`)

```ts
import { l, s, c, i } from "@/utils/log";

const danger = c("red");
const ok     = s({ color: "green", fontWeight: "bold" });
const loud   = s(ok, danger, { textDecoration: "underline" }); // combine (first arg is a Style)

l`${s("error", { color: "red" })}: could not load ${url}`.error();  // one-off styled segment
l`${s("error", danger)} happened`.error();                          // apply a predefined style
l`${danger("error")} happened`.error();                             // callable shorthand (same result)
l`${s("✓ saved", ok, { fontStyle: "italic" })} ${count}`.info();    // apply + combine inline
l`[control:${key}] ${msg}`.debug({ prev, value });                  // nothing wrapped → all plain
```

### Exports

- `l` — the tag function (kept short; not renamed to `log`).
- `s` — overloaded, discriminated by whether the **first arg is a string**
  (a string is neither a `Style` nor a `LogCSSProperties` object):
  - `s(...styles: StyleInput[]): Style` — **combine** styles into one reusable,
    callable `Style`. Merges left-to-right (later declarations win).
  - `s(text: string, ...styles: StyleInput[]): StyledText` — **apply** style(s)
    to text, producing one atomic styled segment.
  - `StyleInput = Style | LogCSSProperties`.
- `c(color): Style` — shorthand for `s({ color })` (callable, like any `Style`).
- `i(svg: string): string` — SVG string → CSS `url(...)` value for a
  `backgroundImage`. Returns a plain string (a CSS value, not a `Style`).

`LogCSSProperties` type stays as-is.

## Core types

```ts
// Reusable style. Callable: applying it to text yields a StyledText.
interface Style {
  (text: string): StyledText;   // callable application
  readonly css: string;          // "color: cyan;font-weight: bold;"
  toString(): string;            // returns css (so a Style still drops into raw console.log)
}

// An atomic styled segment.
interface StyledText {
  readonly text: string;
  readonly css: string;
}
```

Both carry a **real runtime brand** (a `Symbol` property), so the tag can tell a
`Style`/`StyledText` apart from a plain string/object value at runtime. The
sketch's `LogCSSString & { __brand }` was compile-time-only (`isLogCSSString`
just checked `typeof === "string"`) and cannot do this.

## The tag: parsing + emission

`` l`...` `` returns a holder exposing `log, debug, info, warn, error`. Each
method takes only trailing args (`...args: unknown[]`) — **no options bag**.
Each builds exactly one call:

```
console[level](format, ...positionalArgs, ...trailingArgs)
```

### Slot resolution

Walking `strings[0], slot[0], strings[1], …, strings[n]`:

| Slot value                                | Effect                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `StyledText`                              | append `%c<text>%c`; push `[css, ""]` to positionalArgs (style, then reset) |
| `Style` (bare, not applied)               | no-op — renders nothing (you're meant to apply it to text)             |
| `string` / `number` / `boolean` / `bigint`| spliced inline as plain text (`String(v)`, `%`-escaped)               |
| `null` / `undefined`                      | spliced inline as empty string `""`                                    |
| object / function / array (non-branded)   | append `%o`; push value to positionalArgs (stays inspectable, in position) |

- Literal template text and string-coerced values have `%` escaped to `%%`.
- `positionalArgs` are collected in specifier order, so each `%c`/`%o` consumes
  the right one automatically.
- `trailingArgs` (from the emit method) print after — ideal for objects to
  expand in devtools.
- Combining styles is done via `s(...)`, **not** array slots; a plain array in a
  slot is therefore just an inspectable `%o` value.

### Worked examples

```ts
l`${s("error", { color: "red" })}: could not load ${url}`.error();
// console.error("%cerror%c: could not load <url>", "color: red;", "")

l`${danger("boom")} ${obj}`.warn();
// console.warn("%cboom%c %o", "color: red;", "", obj)

l`[control:${key}] ${msg}`.debug({ prev, value });
// console.debug("[control:<key>] <msg>", { prev, value })   // all inline plain text
```

A `StyledText` always emits its trailing reset `%c` even when adjacent to another
styled token (the redundant reset is harmless).

## CSS serialization (`toLogCSS`)

- camelCase → kebab-case (existing `toLogCSSProperty`).
- Remove the dead `cssString.__logCSSStringBrand = true` line.
- **Numeric values** get `px` appended **only for length properties** — a
  `PX_PROPS` allowlist: `fontSize`, `width`, `height`, `padding`(+`Top`/`Right`/
  `Bottom`/`Left`), `margin`(+`Top`/`Right`/`Bottom`/`Left`), `borderWidth`,
  `borderRadius`. Other numerics pass through unitless (`fontWeight: 700`,
  `lineHeight: 1.5`). Fixes the sketch's `padding: 2` (invalid CSS, silently
  dropped by browsers) → `padding: 2px`.
- Output stays a `;`-terminated string; merging is concatenation.

## Bug fixes folded in

- **`i()` uses Node's `Buffer`** in a browser-only file (throws in-browser).
  Replace base64 with URL-encoding (no base64 needed, handles non-Latin1 SVGs):
  `` `url("data:image/svg+xml,${encodeURIComponent(svg)}")` ``.
- **Call site** `src/utils/control-panel/control-context.tsx` currently calls the
  old (wrong) `l` API, which won't compile against the new one. Per decision,
  **remove that usage** rather than port it: fall back to plain
  `` console.debug(`[control:${key}] ${msg}`, ...args) `` and drop the now-unused
  `@/utils/log` import (verify `s` isn't referenced elsewhere in the file first).
  This keeps `__tests__/control-panel.test.ts` green untouched (first debug arg
  stays `"[control:loud] committed"`). Re-integrating the styled logger here, plus
  updating that test to the `%c…%c` shape, is **deferred (owner: user)**.

## Out of scope (YAGNI)

- `group` / `groupCollapsed` / `groupEnd` (levels only for v1).
- `table` / `time` / `timeEnd` — take data/labels, not a styled message.
- Any options bag on emit methods.
- Array-as-combined-styles slots (use `s(...)`).
- Server/SSR guarding — Node's `util.format` strips `%c` (consumes the arg,
  prints empty), so calls are safe-but-unstyled; left unguarded intentionally.

## Tests — new `__tests__/log.test.ts` (vitest)

Spy on `console.*` and assert exact call args:

- format + positional-arg ordering for a mixed styled/value template.
- `s(...)` combine vs `s(text, ...)` apply; callable `style(text)` ≡ `s(text, style)`.
- inline plain string/number; `null`/`undefined` → empty; object → `%o` + positional.
- bare `Style` slot → no-op.
- `%` in literal text and in a string value → `%%`.
- trailing args land after positional args.
- serialization: kebab-case; `px` appended for length props (`padding: 2`→`2px`)
  but NOT for `fontWeight`/`lineHeight`.
- `i()` returns `url("data:image/svg+xml,…")` URL-encoded (no `Buffer`).

---

# Revision (v2): nested styles

**Date:** 2026-06-19
**Status:** approved design, pending implementation plan
**Motivation:** v1's `StyledText` is flat (`{ text, css }`), so a styled region
cannot contain differently-styled sub-regions (e.g. a red `KEY` inside a
purple-background `[control:KEY]`). JS template-literal nesting can't help — it
`String()`-coerces the inner `StyledText`, losing the brand. This revision makes
`StyledText` a tree and renders cascaded styles via the `%c` engine.

**Backward compatibility:** all v1 behavior and tests are preserved byte-for-byte
(see "run coalescing" below). Only the two v1 tests that read `StyledText.text`
change (now `.parts`).

## Data model

`StyledText` becomes a tree of parts:

```ts
type Part = string | StyledText;

export interface StyledText {
  readonly parts: ReadonlyArray<Part>;
  readonly css: string; // this node's OWN css (not cascaded)
  toString(): string;   // flattened plain text (see below)
}
```

A leaf `s("boom", c("red"))` → `{ parts: ["boom"], css: "color: red;" }`.

## API change: `s` becomes variadic; `Style` callable becomes variadic

```ts
type Part = string | StyledText;

export function s(...styles: StyleInput[]): Style;                          // combine
export function s(first: Part, ...rest: (Part | StyleInput)[]): StyledText; // apply
```

- **The first arg discriminates.** First arg is content (`string` | branded
  `StyledText`) → **apply**: partition *every* arg into content `parts` (kept in
  order) and styles, then combine the styles into this node's css. First arg is a
  style (`Style` | `LogCSSProperties`) → **combine** → reusable `Style` (so
  `s({…})`, `c`, and `s(bold, danger)` are unchanged).
- A **style arg applies to the whole node**, wherever it sits positionally —
  there is no positional "covers only the previous arg." Per-part styling = nest
  (`s(s("a", c("red")), s("b", c("blue")))`).
- **Lead with content:** `s({ bg }, "text")` is a type error (first arg is a
  style, the rest aren't all styles) — write `s("text", { bg })`. Spreading a
  dynamic content list works: `s(...parts, { fontWeight: 700 })`.
- `Style` callable widens from `(text: string)` to `(...parts: Part[])`, so
  `danger("a", child)` works (and `danger("boom")` as before).
- Internal: `makeStyledText(parts: Part[], css: string)`. Apply impl —
  `isContent = (a) => typeof a === "string" || isStyledText(a)`;
  `parts = args.filter(isContent)`;
  `css = args.filter((a) => !isContent(a)).map(cssOf).join("")`.

## `StyledText.toString()`

Returns flattened plain text (recurse into child parts, concatenate):

```ts
const flattenText = (n: StyledText): string =>
  n.parts.map((p) => (typeof p === "string" ? p : flattenText(p))).join("");
```

So an accidental JS-template nesting degrades to readable text (styles dropped)
instead of `"[object Object]"`. `Style.toString()` still returns its css.

## Rendering: cascade flatten + run coalescing

The tag flattens each `StyledText` subtree into `(text, fullCss)` runs, where
`fullCss` is the root→leaf css concatenation (later-wins = child overrides
parent). It emits a `%c` **only when the active style changes**, tracking a
`currentCss`:

```ts
// inside build():
let currentCss = "";
const emitRun = (text: string, css: string) => {
  if (css !== currentCss) {
    format += "%c";
    positional.push(css);
    currentCss = css;
  }
  format += escapePct(text);
};
const emitNode = (node: Part, baseCss: string) => {
  if (isStyledText(node)) {
    const css = baseCss + node.css;
    for (const part of node.parts) emitNode(part, css);
  } else {
    emitRun(node, baseCss); // node is a string
  }
};
```

Per template piece: literal strings → `emitRun(str, "")` (always, even empty —
this is what produces the trailing reset `%c` after a styled segment); a
`StyledText` slot → `emitNode(slot, "")`; bare `Style` / `null` / `undefined` →
nothing; primitive slot → `emitRun(String(slot), "")`; object/function/array slot
→ `format += "%o"` + push value (does not change `currentCss`).

**Why v1 output is unchanged:** an all-plain template keeps `currentCss === ""`
throughout, so zero `%c` are emitted (identical to v1). A single styled segment
`${s("hi", red)}` emits `%c` entering it and `%c` resetting on the next (possibly
empty) literal — exactly v1's `%chi%c` with `["color: red;", ""]`. (This replaces
v1's "always emit `%c<text>%c` per `StyledText`" rule; the observable output is
the same for non-nested cases, and correct for nested ones.)

### Worked nesting example

```ts
l`${s("[control:", s(key, c("red")), "]", { backgroundColor: "rebeccapurple", padding: 2 })} ${s(msg, c("rebeccapurple"))}`.debug(...args);
// format:     "%c[control:%c<key>%c]%c %c<msg>%c"
// positional: [ bgpad, bgpad+red, bgpad, "", "color: rebeccapurple;", "" ]
// → "[control:" purple-bg · key red-on-purple · "]" purple-bg · msg purple
```

## Scope & out of scope (v2)

- **In scope:** `src/utils/log.ts` + `__tests__/log.test.ts` only.
- **Out of scope (owner: user):** `control-context.tsx` (its line-206 nesting
  attempt and the duplicate `console.debug`) and `control-panel.test.ts`.
- Content args are `string | StyledText` only — a props object / `Style` in arg
  position is always treated as a *style*, never content; arbitrary objects are
  not valid content (objects/`%o` remain a top-level-template-slot feature).

## Tests (v2 additions / changes to `__tests__/log.test.ts`)

- **Change:** the two v1 cases asserting `StyledText.text` now assert `.parts`
  (e.g. `s("boom", c("red"), { fontWeight: 700 })` →
  `{ parts: ["boom"], css: "color: red;font-weight: 700;" }`) and compare
  `.parts`/`.css` for callable ≡ apply.
- Variadic content: `s("a", "b", c("red"))` → one run `"ab"` at `red` (style
  applies to the whole node regardless of position).
- Combine still works: `s({…})` and `s(bold, danger)` return a `Style`, not a
  `StyledText`.
- Two-level nesting cascades and restores: the worked example above asserts the
  exact `format` + `positional`.
- Child overrides parent: inner `color` wins over outer `color` via concatenation.
- **Regression guard:** an all-plain template emits **no** `%c`; a single styled
  segment emits the identical args as v1.
- `StyledText.toString()` returns flattened plain text; `Style.toString()` still
  returns css.

---

# Revision (v3): isolated (non-inheriting) segments — `r()`

**Date:** 2026-06-19
**Status:** approved design, pending implementation plan
**Motivation:** v2 children always inherit the ancestor style cascade. Sometimes
a nested segment should render with *only its own* css — e.g. a clean segment
inside a region that has a background/padding that should not bleed in.

**Backward compatibility:** `s()`, the callable `Style`, and all v2 behavior are
unchanged; the only renderer change is one conditional in `emitNode`.

## API

```ts
export function r(first: Part, ...rest: (Part | StyleInput)[]): StyledText;
```

- `r(...args)` is identical to `s(...)`'s **apply** form (content args → `parts`
  in order, style args → combined node css) **except** the produced node is
  flagged isolated. Single-letter export, joining `l` / `s` / `c` / `i`.
- `r` always returns a `StyledText` (it is apply-only; there is no combine form).
- `r` can wrap an existing node to isolate it: `r(s("x", c("red")))`.

## Data model

`StyledText` gains a flag:

```ts
export interface StyledText {
  readonly parts: ReadonlyArray<Part>;
  readonly css: string;
  readonly reset: boolean; // true → ignore ancestor cascade at render time
  toString(): string;
}
```

- `s()` and the callable `Style` produce `reset: false` (unchanged behavior).
- `r()` produces `reset: true`.
- Internal: `makeStyledText(parts: Part[], css: string, reset = false)`. `s`'s
  apply branch and the `Style` callable pass `false` (or omit); `r` passes `true`.

## Rendering

One line changes in `emitNode` — an isolated node starts its cascade from its own
css instead of `baseCss`:

```ts
const emitNode = (node: Part, baseCss: string) => {
  if (isStyledText(node)) {
    const css = node.reset ? node.css : baseCss + node.css;
    for (const part of node.parts) emitNode(part, css);
  } else {
    emitRun(node, baseCss);
  }
};
```

Isolation severs the chain **only at this node**; the node's own descendants
still cascade from its css. The parent style resumes for siblings after the
isolated node (via the existing `currentCss` coalescing).

### Worked example

```ts
l`${s("[", r("x", c("red")), "]", { backgroundColor: "purple", padding: 2 })}`.log();
// format:     "%c[%cx%c]%c"
// positional: [ "background-color: purple;padding: 2px;", "color: red;",
//               "background-color: purple;padding: 2px;", "" ]
// → "[" and "]" purple-bg+padding · "x" red ONLY (no bg/padding bleed)
```

## Scope (v3)

- **In scope:** `src/utils/log.ts` + `__tests__/log.test.ts` only.

## Tests (v3 additions to `__tests__/log.test.ts`)

- `r("x", c("red"))` has `reset: true`; an equivalent `s("x", c("red"))` has
  `reset: false`.
- Isolation: in the worked example above, `"x"` renders at `color: red;` only —
  assert the exact `format` + `positional` (the purple/padding bg does not appear
  on the `x` run).
- Descendants still cascade from the `r` node: `r("a", s("b", c("blue")), c("red"))`
  → `"a"` at `red`, `"b"` at `red + blue` (no ancestor css).
- Parent style resumes after the `r` node for trailing siblings.
- `r(s("x", c("red")))` isolates an existing node (outer `reset: true`, child
  preserved).
