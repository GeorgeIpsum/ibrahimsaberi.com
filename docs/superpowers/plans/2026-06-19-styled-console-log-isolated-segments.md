# Styled Console Logger — Isolated Segments `r()` (v3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `r(...)` — an isolated styled segment that, when nested, ignores the ancestor style cascade and renders with only its own css.

**Architecture:** `StyledText` gains a `reset: boolean` flag; `r()` is `s()`'s apply form with `reset: true` (both routed through a shared `applyContent` helper); the `l` tag's `emitNode` starts an isolated node's cascade from its own css instead of the inherited base. `s()`, the callable `Style`, and all other behavior are unchanged.

**Tech Stack:** TypeScript, React `CSSProperties` (types only), Vitest, Biome.

## Global Constraints

- **Browser-only utility.** No server guards. Keep the top-of-file `// NOTE:` comment.
- **Single-letter public API:** `l`, `s`, `c`, `i`, and now `r`. Do NOT rename.
- **Biome:** 2-space indent, double quotes, semicolons. No `any` (use `unknown`/`Record<symbol, unknown>`/typed predicate casts). No empty block statements.
- **In scope:** `src/utils/log.ts` + `__tests__/log.test.ts` ONLY.
- **Out of scope (do NOT touch):** `control-context.tsx`, `control-panel.test.ts`.
- **Backward compatibility:** every existing test in `__tests__/log.test.ts` must keep passing unchanged. `s()` / callable `Style` keep producing `reset: false`.
- **Test command (scoped):** `pnpm vitest run __tests__/log.test.ts`. Assertions check exact args passed to `console.*`.
- **Commits:** the user commits manually. Treat the `git commit` step as a checkpoint — run it only if the user opts in.

---

## File Structure

- `src/utils/log.ts` — modify in place. Four touch points: `StyledText` interface (+`reset`), factories (`makeStyledText` gains a `reset` param; new shared `applyContent` helper), public api (`s` apply branch delegates to `applyContent`; new `r` export), and `emitNode` in `build` (one conditional).
- `__tests__/log.test.ts` — append a v3 `describe` block.

---

## Task 1: Isolated segments via `r()`

**Files:**
- Modify: `src/utils/log.ts`
- Test: `__tests__/log.test.ts`

**Interfaces:**
- Consumes (already in the file): `Part`, `StyledText`, `Style`, `StyleInput`, `isContent`, `isStyle`, `isStyledText`, `cssOf`, `makeStyle`, `l`, `c`.
- Produces (new/changed):
  - `StyledText` gains `readonly reset: boolean`.
  - `makeStyledText(parts: Part[], css: string, reset?: boolean): StyledText`.
  - `applyContent(args: (Part | StyleInput)[], reset: boolean): StyledText` (internal).
  - `export function r(first: Part, ...rest: (Part | StyleInput)[]): StyledText`.

- [ ] **Step 1: Write the failing tests**

Append this `describe` block to the end of `__tests__/log.test.ts`:

```ts
describe("isolated segments — r()", () => {
  it("r() marks the node isolated (reset:true); s() does not", () => {
    expect(r("x", c("red")).reset).toBe(true);
    expect(s("x", c("red")).reset).toBe(false);
  });

  it("an isolated node ignores the ancestor cascade", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`${s("[", r("x", c("red")), "]", { backgroundColor: "purple", padding: 2 })}`.log();
    const bgpad = "background-color: purple;padding: 2px;";
    expect(spy).toHaveBeenCalledWith(
      "%c[%cx%c]%c",
      bgpad,
      "color: red;",
      bgpad,
      "",
    );
  });

  it("descendants of an isolated node cascade from it, not the ancestor", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`${s("outer", r("a", s("b", c("blue")), c("red")), { backgroundColor: "purple" })}`.log();
    expect(spy).toHaveBeenCalledWith(
      "%couter%ca%cb%c",
      "background-color: purple;",
      "color: red;",
      "color: red;color: blue;",
      "",
    );
  });

  it("the parent style resumes after an isolated node", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    l`${s("a", r("b", c("red")), "c", c("green"))}`.log();
    expect(spy).toHaveBeenCalledWith(
      "%ca%cb%cc%c",
      "color: green;",
      "color: red;",
      "color: green;",
      "",
    );
  });

  it("r() wraps an existing node to isolate it", () => {
    const inner = s("x", c("red"));
    const wrapped = r(inner);
    expect(wrapped.reset).toBe(true);
    expect(wrapped.parts).toEqual([inner]);
    expect(wrapped.css).toBe("");
  });
});
```

Also add `r` to the import at the top of the file (change `import { c, i, l, s } from "@/utils/log";` to `import { c, i, l, r, s } from "@/utils/log";`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run __tests__/log.test.ts`
Expected: FAIL — `r` is not exported (`r is not a function`), and `.reset` is `undefined` on `StyledText`.

- [ ] **Step 3: Add `reset` to the `StyledText` interface**

In `src/utils/log.ts`, replace:

```ts
/** A styled segment: an ordered list of parts plus this node's own css. */
export interface StyledText {
  readonly parts: ReadonlyArray<Part>;
  readonly css: string;
  toString(): string;
}
```

with:

```ts
/** A styled segment: an ordered list of parts plus this node's own css. */
export interface StyledText {
  readonly parts: ReadonlyArray<Part>;
  readonly css: string;
  /** When true, render ignores the ancestor cascade and starts from `css`. */
  readonly reset: boolean;
  toString(): string;
}
```

- [ ] **Step 4: Add a `reset` param to `makeStyledText` and a shared `applyContent` helper**

Replace this block:

```ts
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

with:

```ts
const makeStyledText = (
  parts: Part[],
  css: string,
  reset = false,
): StyledText => {
  const styled = { parts, css, reset } as StyledText & Record<symbol, unknown>;
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

// Partition content args (kept in order) from style args (combined into css)
// and build a segment. `reset` flags it isolated (ignores ancestor cascade).
const applyContent = (
  args: (Part | StyleInput)[],
  reset: boolean,
): StyledText => {
  const parts = args.filter(isContent);
  const css = args
    .filter((a): a is StyleInput => !isContent(a))
    .map(cssOf)
    .join("");
  return makeStyledText(parts, css, reset);
};
```

- [ ] **Step 5: Route `s` apply through `applyContent` and add `r`**

First, update the section header — replace:

```ts
/* ---------- public api: s, c, i ---------- */
```

with:

```ts
/* ---------- public api: s, r, c, i ---------- */
```

Then replace the `s` implementation:

```ts
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

with (delegating to `applyContent`, then adding `r`):

```ts
export function s(...styles: StyleInput[]): Style;
export function s(first: Part, ...rest: (Part | StyleInput)[]): StyledText;
export function s(...args: (Part | StyleInput)[]): Style | StyledText {
  if (args.length > 0 && isContent(args[0])) {
    return applyContent(args, false);
  }
  return makeStyle((args as StyleInput[]).map(cssOf).join(""));
}

/**
 * Like `s(...)`'s apply form, but the segment is ISOLATED: at render time it
 * ignores the ancestor style cascade and starts from its own css (its own
 * descendants still cascade from it). Apply-only — always a `StyledText`.
 *
 * @example l`${s("[", r("x", c("red")), "]", { backgroundColor: "purple" })}`;
 * // "[" and "]" purple-bg; "x" is red only (no bg bleed)
 */
export function r(first: Part, ...rest: (Part | StyleInput)[]): StyledText {
  return applyContent([first, ...rest], true);
}
```

- [ ] **Step 6: Honor `reset` in the renderer**

In `build`, replace:

```ts
  const emitNode = (node: Part, baseCss: string) => {
    if (isStyledText(node)) {
      const css = baseCss + node.css;
      for (const part of node.parts) emitNode(part, css);
    } else {
      emitRun(node, baseCss);
    }
  };
```

with:

```ts
  const emitNode = (node: Part, baseCss: string) => {
    if (isStyledText(node)) {
      // an isolated node ignores the ancestor cascade, starting from its own css
      const css = node.reset ? node.css : baseCss + node.css;
      for (const part of node.parts) emitNode(part, css);
    } else {
      emitRun(node, baseCss);
    }
  };
```

- [ ] **Step 7: Run tests + typecheck + lint to verify green**

Run: `pnpm vitest run __tests__/log.test.ts`
Expected: PASS (all prior cases unchanged; the 5 new `r()` cases pass).

Run: `pnpm exec tsc --noEmit 2>&1 | rg 'utils/log\.ts|__tests__/log\.test\.ts' || echo "No type errors in log files"`
Expected: `No type errors in log files`

Run: `pnpm biome check src/utils/log.ts __tests__/log.test.ts`
Expected: no errors (use `--write` if only formatting differs).

- [ ] **Step 8: Commit** *(checkpoint — only if the user opts in)*

```bash
git add src/utils/log.ts __tests__/log.test.ts
git commit -m "feat(log): r() isolated (non-inheriting) styled segments"
```

---

## Self-Review (performed during planning)

**Spec coverage (v3 section):**
- `r(first, ...rest): StyledText`, apply-only, single-letter → Step 5; covered by reset/isolation/wrap tests.
- `StyledText.reset` flag; `s`/callable → `false`, `r` → `true` → Steps 3–5; covered by "marks isolated" test.
- `makeStyledText(..., reset = false)` + shared `applyContent` → Step 4.
- Renderer: isolated node starts from own css, descendants cascade from it, parent resumes after → Step 6; covered by the cascade, descendants, and resume tests.
- `r` wraps an existing node → Step 5; covered by the wrap test.
- Backward compat (`s`/callable unchanged, all prior tests pass) → existing tests untouched; `applyContent(args, false)` reproduces the prior `s` apply behavior exactly.

**Placeholder scan:** none — every step shows exact old/new code and exact commands.

**Type consistency:** `reset` is added to `StyledText` (Step 3), set by `makeStyledText` (Step 4), produced via `applyContent` (Step 4) from both `s` (`false`) and `r` (`true`) (Step 5), and read by `emitNode` (Step 6). `applyContent` signature matches its two call sites. `r`'s signature matches the spec and the test usage.
