import { afterEach, describe, expect, it, vi } from "vitest";
import { c, i, l, r, s } from "@/utils/log";

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
});

describe("i() svg → styled image", () => {
  it("returns a StyledText: a space carrying the URL-encoded svg as background-image", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const img = i(svg);
    expect(img.parts).toEqual([" "]);
    expect(img.css).toBe(
      `background-image: url("data:image/svg+xml,${encodeURIComponent(svg)}");`,
    );
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
