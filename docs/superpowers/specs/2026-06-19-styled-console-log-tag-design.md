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
```
