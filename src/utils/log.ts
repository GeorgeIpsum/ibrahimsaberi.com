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
  typeof v === "function" &&
  (v as unknown as Record<symbol, unknown>)[STYLE] === true;

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
