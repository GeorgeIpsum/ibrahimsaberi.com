import { afterEach, describe, expect, it, vi } from "vitest";
import { c, i, l, s } from "@/utils/log";

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
    expect(i(svg)).toBe(`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  });
});

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
