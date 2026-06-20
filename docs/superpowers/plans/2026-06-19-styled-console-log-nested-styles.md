# Styled Console Logger — Nested Styles (v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `src/utils/log.ts` so styled segments can nest — a styled region can contain differently-styled sub-regions, with children inheriting the parent style and restoring it afterward.

**Architecture:** `StyledText` becomes a tree (`{ parts, css }`); `s` becomes variadic (content args + style args, first arg discriminates apply vs combine); the `l` tag flattens each subtree into `(text, fullCss)` runs and emits a `%c` only when the active style changes (`currentCss` tracking), which keeps all non-nested output byte-identical to v1.

**Tech Stack:** TypeScript, React `CSSProperties` (types only), Vitest, Biome.

## Global Constraints

- **Browser-only utility.** No server guards. Keep the top-of-file `// NOTE:` comment.
- **Single-letter public API:** `l`, `s`, `c`, `i`. Do NOT rename.
- **Biome:** 2-space indent, double quotes, semicolons. No `any` (use `unknown`/`Record<symbol, unknown>` casts). No empty block statements (use `continue`, not empty `{}`). Run `pnpm biome check` on touched files.
- **In scope:** `src/utils/log.ts` + `__tests__/log.test.ts` ONLY.
- **Out of scope (do NOT touch):** `src/utils/control-panel/control-context.tsx` (its line-206 nesting attempt + duplicate `console.debug` are the user's) and `__tests__/control-panel.test.ts`.
- **Backward compatibility:** every existing v1 tag test in `__tests__/log.test.ts` must keep passing **unchanged**. Only the two v1 style tests that read `StyledText.text` change (to `.parts`).
- **Test command (scoped):** `pnpm vitest run __tests__/log.test.ts`. Assertions check exact args passed to `console.*`.
- **Commits:** the user commits manually. Treat the `git commit` step as a checkpoint — run it only if the user opts in.

---

## File Structure

- `src/utils/log.ts` — modify in place. Four regions change: the brands block (new `Part` type, tree-shaped `StyledText`, variadic `Style`, `isStyledText`/`isContent` moved up), the factories block (`flattenText`, tree `makeStyledText`, variadic `makeStyle` callable), the public `s` (variadic), and the `l`-tag `build` (run-coalescing renderer). `LogCSSProperties`, serialization, `c`, `i`, and `l` itself are unchanged.
- `__tests__/log.test.ts` — modify in place: retarget two `.text` assertions to `.parts`; add nesting/variadic/toString cases.

---

## Task 1: Tree-shaped `StyledText`, variadic `s`, and nested rendering

**Files:**
- Modify: `src/utils/log.ts`
- Test: `__tests__/log.test.ts`

**Interfaces:**
- Consumes (already in the file): `STYLE`/`STYLED` symbols, `isStyle`, `cssOf`, `toLogCSS`, `escapePct`, `LogHolder`, `l`.
- Produces (changed/new):
  - `export type Part = string | StyledText`
  - `export interface StyledText { readonly parts: ReadonlyArray<Part>; readonly css: string; toString(): string }`
  - `export interface Style { (...parts: Part[]): StyledText; readonly css: string }`
  - `export function s(...styles: StyleInput[]): Style` / `export function s(first: Part, ...rest: (Part | StyleInput)[]): StyledText`
  - Internal: `isStyledText`, `isContent`, `flattenText`, run-coalescing `build`.

- [ ] **Step 1: Update the two `.text` tests and add v2 tests**

In `__tests__/log.test.ts`, **replace** the test `"s(text, ...styles) applies styles to text → StyledText"` body and the `"calling a style (style(text)) equals s(text, style)"` body so they read `.parts`:

```ts
  it("s(text, ...styles) applies styles to text → StyledText", () => {
    const styled = s("boom", c("red"), { fontWeight: 700 });
    expect(styled.parts).toEqual(["boom"]);
    expect(styled.css).toBe("color: red;font-weight: 700;");
  });

  it("calling a style (style(text)) equals s(text, style)", () => {
    const danger = c("red");
    const viaCall = danger("boom");
    const viaApply = s("boom", danger);
    expect(viaCall.parts).toEqual(viaApply.parts);
    expect(viaCall.css).toBe(viaApply.css);
  });
```

Then **append** a new `describe` block to the end of the file:

```ts
describe("nested / variadic styles", () => {
  it("s(...) stays combine (returns a callable Style) when no content args", () => {
    expect(typeof s({ color: "red" })).toBe("function");
    expect(typeof s(s({ fontWeight: 700 }), c("red"))).toBe("function");
    expect(s({ color: "red" }).css).toBe("color: red;");
  });

  it("collects multiple content args into parts; style applies to whole node", () => {
    const node = s("a", "b", c("red"));
    expect(node.parts).toEqual(["a", "b"]);
    expect(node.css).toBe("color: red;");
  });

  it("renders multiple content parts as one run at the node style", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`${s("a", "b", c("red"))}`.log();
    expect(spy).toHaveBeenCalledWith("%cab%c", "color: red;", "");
  });

  it("nests: children inherit parent css and the parent is restored after", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const key = "loud";
    const msg = "committed";
    l`${s("[control:", s(key, c("red")), "]", { backgroundColor: "rebeccapurple", padding: 2 })} ${s(msg, c("rebeccapurple"))}`.debug(
      "x",
    );
    const bgpad = "background-color: rebeccapurple;padding: 2px;";
    expect(spy).toHaveBeenCalledWith(
      "%c[control:%cloud%c]%c %ccommitted%c",
      bgpad,
      `${bgpad}color: red;`,
      bgpad,
      "",
      "color: rebeccapurple;",
      "",
      "x",
    );
  });

  it("child css overrides parent (later wins in the concatenated run)", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`${s("outer", s("inner", c("blue")), c("red"))}`.log();
    expect(spy).toHaveBeenCalledWith(
      "%couter%cinner%c",
      "color: red;",
      "color: red;color: blue;",
      "",
    );
  });

  it("StyledText.toString() returns flattened plain text", () => {
    expect(String(s("a", s("b", c("red")), "c"))).toBe("abc");
  });

  it("emits no %c for an all-plain template (v1 regression)", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`hello ${"world"} ${42}`.log();
    expect(spy).toHaveBeenCalledWith("hello world 42");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run __tests__/log.test.ts`
Expected: FAIL — `.parts` is `undefined` (v1 `StyledText` has `.text`), `s("a", "b", c("red"))` mis-parses the extra content arg, and the nested-render expectations don't match v1's flat output.

- [ ] **Step 3: Rewrite the brands block (tree model + predicates)**

In `src/utils/log.ts`, replace this block:

```ts
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
  typeof v === "function" &&
  (v as unknown as Record<symbol, unknown>)[STYLE] === true;
```

with:

```ts
/** A piece of styled-text content: a literal string or a nested segment. */
export type Part = string | StyledText;

/** A reusable style. Call it with content to produce a `StyledText` segment. */
export interface Style {
  (...parts: Part[]): StyledText;
  readonly css: string;
}

/** A styled segment: an ordered list of parts plus this node's own css. */
export interface StyledText {
  readonly parts: ReadonlyArray<Part>;
  readonly css: string;
  toString(): string;
}

const isStyle = (v: unknown): v is Style =>
  typeof v === "function" &&
  (v as unknown as Record<symbol, unknown>)[STYLE] === true;

const isStyledText = (v: unknown): v is StyledText =>
  typeof v === "object" &&
  v !== null &&
  (v as Record<symbol, unknown>)[STYLED] === true;

const isContent = (v: unknown): v is Part =>
  typeof v === "string" || isStyledText(v);
```

- [ ] **Step 4: Rewrite the factories (flatten + tree `makeStyledText` + variadic `makeStyle`)**

Replace this block:

```ts
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
```

with:

```ts
const flattenText = (node: StyledText): string =>
  node.parts.map((p) => (typeof p === "string" ? p : flattenText(p))).join("");

const makeStyledText = (parts: Part[], css: string): StyledText => {
  const styled = { parts, css } as StyledText & Record<symbol, unknown>;
  styled[STYLED] = true;
  styled.toString = () => flattenText(styled);
  return styled;
};

const makeStyle = (css: string): Style => {
  const style = ((...parts: Part[]) => makeStyledText(parts, css)) as Style &
    Record<symbol, unknown> & { css: string; toString: () => string };
  style.css = css;
  style.toString = () => css;
  style[STYLE] = true;
  return style;
};
```

- [ ] **Step 5: Make `s` variadic**

Replace the `s` doc-comment + overloads + implementation:

```ts
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
```

with:

```ts
/**
 * Variadic. If the first arg is content (a string or a `StyledText`), APPLY:
 * every content arg becomes a part (in order) and every style arg is combined
 * into this node's css (a style applies to the whole node, wherever it sits).
 * Otherwise COMBINE: all args are styles merged into a reusable, callable
 * `Style`. Styles merge left-to-right; later declarations win.
 *
 * @example const danger = s({ color: "red", fontWeight: 700 });   // combine
 * @example l`${s("error", danger)} occurred`.error();             // apply
 * @example s("[", s(key, c("red")), "]", { backgroundColor: "purple" }); // nest
 */
export function s(...styles: StyleInput[]): Style;
export function s(first: Part, ...rest: (Part | StyleInput)[]): StyledText;
export function s(...args: (Part | StyleInput)[]): Style | StyledText {
  if (args.length > 0 && isContent(args[0])) {
    const parts = args.filter(isContent);
    const css = args
      .filter((a): a is StyleInput => !isContent(a))
      .map(cssOf)
      .join("");
    return makeStyledText(parts, css);
  }
  return makeStyle((args as StyleInput[]).map(cssOf).join(""));
}
```

- [ ] **Step 6: Remove the moved `isStyledText` and rewrite `build`**

First, delete the now-duplicate predicate from the tag section — replace:

```ts
const isStyledText = (v: unknown): v is StyledText =>
  typeof v === "object" &&
  v !== null &&
  (v as Record<symbol, unknown>)[STYLED] === true;

// `%` is a console format-specifier prefix; double it so literal text and
// string values can't accidentally consume positional args.
const escapePct = (str: string) => str.replace(/%/g, "%%");
```

with (predicate removed; keep `escapePct`):

```ts
// `%` is a console format-specifier prefix; double it so literal text and
// string values can't accidentally consume positional args.
const escapePct = (str: string) => str.replace(/%/g, "%%");
```

Then replace the whole `build` function:

```ts
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
```

with:

```ts
const build = (strings: TemplateStringsArray, slots: unknown[]) => {
  let format = "";
  const positional: unknown[] = [];
  // The style currently active in the console. Emit a `%c` only when it
  // changes, so plain/non-nested templates emit no extra format specifiers.
  let currentCss = "";

  const emitRun = (text: string, css: string) => {
    if (css !== currentCss) {
      format += "%c";
      positional.push(css);
      currentCss = css;
    }
    format += escapePct(text);
  };

  // Flatten a styled subtree, cascading css from ancestors (later wins) so a
  // child re-declares its parent's style and the parent is restored after it.
  const emitNode = (node: Part, baseCss: string) => {
    if (isStyledText(node)) {
      const css = baseCss + node.css;
      for (const part of node.parts) emitNode(part, css);
    } else {
      emitRun(node, baseCss);
    }
  };

  for (let idx = 0; idx < strings.length; idx++) {
    emitRun(strings[idx], "");
    if (idx >= slots.length) continue;

    const slot = slots[idx];

    if (isStyledText(slot)) {
      emitNode(slot, "");
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
      emitRun(String(slot), "");
      continue;
    }
    // objects / functions / arrays → inspectable %o in position
    format += "%o";
    positional.push(slot);
  }

  return { format, positional };
};
```

- [ ] **Step 7: Run tests + typecheck + lint to verify green**

Run: `pnpm vitest run __tests__/log.test.ts`
Expected: PASS (all v1 cases still pass; new nesting/variadic/toString cases pass).

Run: `pnpm exec tsc --noEmit 2>&1 | rg 'utils/log\.ts|__tests__/log\.test\.ts' || echo "No type errors in log files"`
Expected: `No type errors in log files`

Run: `pnpm biome check src/utils/log.ts __tests__/log.test.ts`
Expected: no errors (use `pnpm biome check --write …` if only formatting differs).

- [ ] **Step 8: Commit** *(checkpoint — only if the user opts in)*

```bash
git add src/utils/log.ts __tests__/log.test.ts
git commit -m "feat(log): nested styles via tree StyledText + variadic s"
```

---

## Self-Review (performed during planning)

**Spec coverage (v2 section):**
- Tree `StyledText` (`parts`, own `css`, `toString`) → Step 3 (interface) + Step 4 (`flattenText`/`makeStyledText`).
- Variadic `s` (first-arg discriminator; styles apply to whole node; combine unchanged) → Step 5; covered by the "stays combine", "collects parts", and apply tests.
- `Style` callable widens to `(...parts)` → Step 4 (`makeStyle`) + Step 3 (interface); covered by callable≡apply test.
- `toString` flattened plain text → Step 4; covered by toString test.
- Cascade flatten + run coalescing (`currentCss`, `emitRun`/`emitNode`) → Step 6; covered by nesting, override, multi-part-run tests.
- v1 byte-identical regression → existing v1 tests kept unchanged + explicit all-plain guard test.
- Scope (log.ts + tests only; control-panel untouched) → Global Constraints.

**Placeholder scan:** none — every step shows exact old/new code and exact commands.

**Type consistency:** `Part`, `StyledText`, `Style`, `s` signatures, and `isStyledText`/`isContent`/`flattenText`/`makeStyledText` names are used identically across steps. `isStyledText` is defined once (Step 3, brands) and the duplicate in the tag section is removed (Step 6). `makeStyledText` switches to `(parts: Part[], css)` in Step 4 and is called that way by `s` (Step 5), `makeStyle` (Step 4), and the `Style` callable.
