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
  backgroundPosition?: CSSProperties["backgroundPosition"];
  backgroundRepeat?: CSSProperties["backgroundRepeat"];

  // border
  border?: CSSProperties["border"];
  borderColor?: CSSProperties["borderColor"];
  borderWidth?: CSSProperties["borderWidth"];
  borderStyle?: CSSProperties["borderStyle"];
  borderRadius?: CSSProperties["borderRadius"];
  borderTopLeftRadius?: CSSProperties["borderTopLeftRadius"];
  borderTopRightRadius?: CSSProperties["borderTopRightRadius"];
  borderBottomRightRadius?: CSSProperties["borderBottomRightRadius"];
  borderBottomLeftRadius?: CSSProperties["borderBottomLeftRadius"];
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
  /** When true, render ignores the ancestor cascade and starts from `css`. */
  readonly reset: boolean;
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
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
  "lineHeight",
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

const flattenText = (node: StyledText): string =>
  node.parts.map((p) => (typeof p === "string" ? p : flattenText(p))).join("");

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

/* ---------- public api: s, r, c, i ---------- */

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

/** Shorthand for `s({ color })`. */
export const c = (color: CSSProperties["color"]): Style => s({ color });

/** SVG string → image that can be used in log fn. */
export const i = (svg: string) =>
  s(" ", {
    paddingLeft: 16,
    backgroundImage: `url("data:image/svg+xml;base64,${btoa(svg)}")`,
    backgroundSize: 16,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    lineHeight: 16,
  });

/* ---------- the l tag ---------- */

type ConsoleLevel = "log" | "debug" | "info" | "warn" | "error";

export interface LogHolder {
  log(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

// `%` is a console format-specifier prefix; double it so literal text and
// string values can't accidentally consume positional args.
const escapePct = (str: string) => str.replace(/%/g, "%%");

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
      // an isolated node ignores the ancestor cascade, starting from its own css
      const css = node.reset ? node.css : baseCss + node.css;
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

// from public/is.svg
export const IS_SVG = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1028 1028" width="16px" height="16px"><defs><style>.c{fill:#022c22;}.c,.d,.e,.f,.g,.h{stroke-width:0px;}.d{fill:#f0abfc;}.e{fill:#4ade80;}.f{fill:#ecfdf5;}.g{fill:#047857;}.h{fill:url(#b);}</style><linearGradient id="b" x1="475.63" y1="104.27" x2="532.88" y2="687.24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbcfe8"/><stop offset="1" stop-color="#fb7185"/></linearGradient></defs><g><path class="d" d="M78.65,642.5c-.3-22.71,13.19-61.55,22.59-82.82.11-.25.66.51,3.01-4.52,28.41,321.68,410.9,484.84,666.34,283.1,106.89-84.42,159.05-205.28,155.86-340.32-.05-2.01.07-4.02,0-6.02,4.24-4.95,7.46-10.86,10.54-16.56,10.43-19.33,18.76-39.38,25.6-60.23,22.06,119.22,7.43,231.8-55.72,336.56-164.39,272.72-555.56,296.19-752.93,46.68-25.51-32.24-74.77-116.22-75.29-155.86Z"/><path class="h" d="M926.45,497.94c3.2,135.05-48.97,255.91-155.86,340.32-255.44,201.74-637.93,38.58-666.34-283.1,1.44-3.07,1.4-4.3,1.51-4.52,63.99-131.09,228.28-250.07,378.72-228.89,77.75,10.94,147.89,84.02,95.62,152.84-32.74,43.11-123.35,37.49-141.55,100.89-20.53,71.52,53.07,115.49,113.69,122.73,147.53,17.62,295.06-81.56,374.21-200.28Z"/></g><g><path class="g" d="M962.59,415.11c-6.84,20.85-15.16,40.91-25.6,60.23-5.83-7.61-3.14-26.68-4.52-36.89-6.08-45.01-20.35-84.09-40.66-124.23C740.09,14.36,325.02-6.02,149.42,290.13c-39.94,67.36-64.4,152.46-58.73,231.15.99,13.69,6.21,51.03,10.54,38.4-9.4,21.27-22.89,60.11-22.59,82.82-3.3.03-8.94-20.85-10.54-27.86-32.83-143.37,4.3-300.64,99.39-412.61C383.31-52.09,781.4,8.47,926.45,301.42c14.91,37.02,28.84,74.22,36.14,113.69Z"/><path class="c" d="M885.79,323.26c27.03,56.18,38.35,106.26,40.66,168.66.07,2-.05,4.02,0,6.02-79.15,118.72-226.68,217.9-374.21,200.28-60.62-7.24-134.22-51.21-113.69-122.73,18.2-63.4,108.81-57.78,141.55-100.89,52.27-68.83-17.88-141.9-95.62-152.84-150.44-21.18-314.74,97.8-378.72,228.89-11.22-95.98,9.49-178.35,55.72-262.02,5.37-4.27,24.83-36.02,33.13-45.93C401.78-4.79,764.04,70.19,885.79,323.26Z"/><path class="f" d="M105.75,550.64c-.1.21-.07,1.44-1.51,4.52-2.36,5.03-2.9,4.27-3.01,4.52-4.33,12.63-9.55-24.71-10.54-38.4-5.68-78.69,18.79-163.79,58.73-231.15,7.17,4.5,5.8,3.47,12.05-1.51-46.22,83.67-66.94,166.04-55.72,262.02Z"/><path class="f" d="M891.81,314.22c20.31,40.14,34.58,79.22,40.66,124.23,1.38,10.22-1.31,29.29,4.52,36.89-3.08,5.7-6.3,11.61-10.54,16.56-2.31-62.39-13.63-112.48-40.66-168.66,7.86.85,2.16-2.64,3.01-9.79q1.51.38,3.01.75Z"/><path class="e" d="M891.81,314.22q-1.51-.38-3.01-.75c-.85,7.14,4.85,10.63-3.01,9.79C764.04,70.19,401.78-4.79,194.6,242.69c-8.3,9.91-27.76,41.66-33.13,45.93-6.25,4.97-4.87,6-12.05,1.51C325.02-6.02,740.09,14.36,891.81,314.22Z"/></g></svg>`;

export const isLogImg = i(IS_SVG);

export const pL = (str: string, style: LogCSSProperties = {}) =>
  s(str, {
    backgroundColor: "rebeccapurple",
    paddingLeft: 6,
    paddingRight: 6,
    borderTopLeftRadius: "0.5em",
    borderBottomLeftRadius: "0.5em",
    fontFamily: "monospace",
    lineHeight: 16,
    fontSize: 9,
    fontWeight: "bold",
    ...style,
  });
export const pR = (str: string, style: LogCSSProperties = {}) =>
  s(str, {
    backgroundColor: "rebeccapurple",
    paddingLeft: 6,
    paddingRight: 6,
    borderLeft: "2px solid purple",
    borderTopRightRadius: "0.5em",
    borderBottomRightRadius: "0.5em",
    fontFamily: "monospace",
    lineHeight: 16,
    fontSize: 9,
    fontWeight: "bold",
    ...style,
  });
