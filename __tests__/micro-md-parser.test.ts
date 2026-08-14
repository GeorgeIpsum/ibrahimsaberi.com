import { describe, expect, it } from "vitest";
import {
  type InlineNode,
  parse,
  parseInline,
} from "@/features/micro-md/parser";

const text = (value: string): InlineNode => ({ type: "text", value });

describe("parseInline: plain text", () => {
  it("returns a single text node for plain input", () => {
    expect(parseInline("just words")).toEqual([text("just words")]);
  });

  it("returns [] for empty input", () => {
    expect(parseInline("")).toEqual([]);
  });
});

describe("parseInline: strong", () => {
  it("parses **bold**", () => {
    expect(parseInline("**bold**")).toEqual([
      { type: "strong", children: [text("bold")] },
    ]);
  });

  it("parses __bold__", () => {
    expect(parseInline("__bold__")).toEqual([
      { type: "strong", children: [text("bold")] },
    ]);
  });

  it("parses surrounding text", () => {
    expect(parseInline("a **b** c")).toEqual([
      text("a "),
      { type: "strong", children: [text("b")] },
      text(" c"),
    ]);
  });
});

describe("parseInline: em", () => {
  it("parses *italic*", () => {
    expect(parseInline("*italic*")).toEqual([
      { type: "em", children: [text("italic")] },
    ]);
  });

  it("parses _italic_", () => {
    expect(parseInline("_italic_")).toEqual([
      { type: "em", children: [text("italic")] },
    ]);
  });
});

describe("parseInline: del", () => {
  it("parses ~~struck~~", () => {
    expect(parseInline("~~struck~~")).toEqual([
      { type: "del", children: [text("struck")] },
    ]);
  });

  it("leaves a lone ~ as text", () => {
    expect(parseInline("a ~ b")).toEqual([text("a ~ b")]);
  });
});

describe("parseInline: nesting", () => {
  it("nests em inside strong", () => {
    expect(parseInline("**bold *it* bold**")).toEqual([
      {
        type: "strong",
        children: [
          text("bold "),
          { type: "em", children: [text("it")] },
          text(" bold"),
        ],
      },
    ]);
  });

  it("parses ***x*** as strong containing em", () => {
    expect(parseInline("***x***")).toEqual([
      {
        type: "strong",
        children: [{ type: "em", children: [text("x")] }],
      },
    ]);
  });
});

describe("parseInline: code spans", () => {
  it("keeps code content raw", () => {
    expect(parseInline("`a *b* c`")).toEqual([
      { type: "code", value: "a *b* c" },
    ]);
  });

  it("does not treat escapes inside code", () => {
    expect(parseInline("`a\\*b`")).toEqual([{ type: "code", value: "a\\*b" }]);
  });

  it("leaves an unclosed backtick as text", () => {
    expect(parseInline("a `b")).toEqual([text("a `b")]);
  });

  it("does not match emphasis closers inside code spans", () => {
    expect(parseInline("**a `**` b**")).toEqual([
      {
        type: "strong",
        children: [text("a "), { type: "code", value: "**" }, text(" b")],
      },
    ]);
  });
});

describe("parseInline: links", () => {
  it("parses [text](url)", () => {
    expect(parseInline("[site](https://a.b)")).toEqual([
      { type: "link", href: "https://a.b", children: [text("site")] },
    ]);
  });

  it("parses inline markup inside the label", () => {
    expect(parseInline("[**b**](u)")).toEqual([
      {
        type: "link",
        href: "u",
        children: [{ type: "strong", children: [text("b")] }],
      },
    ]);
  });

  it("leaves a half-finished link as text", () => {
    expect(parseInline("[text](url")).toEqual([text("[text](url")]);
    expect(parseInline("[text] no paren")).toEqual([text("[text] no paren")]);
  });
});

describe("parseInline: autolinks", () => {
  it("links a bare https URL", () => {
    expect(parseInline("see https://a.b/c ok")).toEqual([
      text("see "),
      {
        type: "link",
        href: "https://a.b/c",
        children: [text("https://a.b/c")],
      },
      text(" ok"),
    ]);
  });

  it("trims trailing punctuation", () => {
    expect(parseInline("go to https://a.b/c.")).toEqual([
      text("go to "),
      {
        type: "link",
        href: "https://a.b/c",
        children: [text("https://a.b/c")],
      },
      text("."),
    ]);
  });

  it("only autolinks after whitespace or at start", () => {
    expect(parseInline("xhttps://a.b")).toEqual([text("xhttps://a.b")]);
  });
});

describe("parseInline: escapes", () => {
  it("escapes punctuation", () => {
    expect(parseInline("\\*not em\\*")).toEqual([text("*not em*")]);
  });

  it("keeps the backslash before non-punctuation", () => {
    expect(parseInline("a\\b")).toEqual([text("a\\b")]);
  });
});

describe("parseInline: malformed input stays literal", () => {
  it("leaves unclosed strong as text", () => {
    expect(parseInline("**never closed")).toEqual([text("**never closed")]);
  });

  it("rejects openers followed by whitespace", () => {
    expect(parseInline("a ** b")).toEqual([text("a ** b")]);
  });

  it("rejects closers preceded by whitespace (delimiter soup)", () => {
    expect(parseInline("**a **b **c")).toEqual([text("**a **b **c")]);
  });

  it("never throws on garbage", () => {
    expect(() => parseInline("**[`~~\\")).not.toThrow();
    expect(() => parseInline("[](")).not.toThrow();
  });
});

describe("parse: paragraphs", () => {
  it("returns [] for empty and whitespace-only input", () => {
    expect(parse("")).toEqual([]);
    expect(parse("  \n\n \t ")).toEqual([]);
  });

  it("parses a single paragraph", () => {
    expect(parse("hello **world**")).toEqual([
      {
        type: "paragraph",
        children: [
          text("hello "),
          { type: "strong", children: [text("world")] },
        ],
      },
    ]);
  });

  it("splits paragraphs on blank lines", () => {
    expect(parse("one\n\ntwo")).toEqual([
      { type: "paragraph", children: [text("one")] },
      { type: "paragraph", children: [text("two")] },
    ]);
  });

  it("turns interior newlines into break nodes", () => {
    expect(parse("a\nb")).toEqual([
      {
        type: "paragraph",
        children: [text("a"), { type: "break" }, text("b")],
      },
    ]);
  });
});

describe("parse: lists", () => {
  it("parses an unordered list with - markers", () => {
    expect(parse("- a\n- b")).toEqual([
      {
        type: "list",
        ordered: false,
        items: [{ children: [text("a")] }, { children: [text("b")] }],
      },
    ]);
  });

  it("parses an unordered list with * markers", () => {
    expect(parse("* a")).toEqual([
      { type: "list", ordered: false, items: [{ children: [text("a")] }] },
    ]);
  });

  it("parses an ordered list", () => {
    expect(parse("1. a\n2. b")).toEqual([
      {
        type: "list",
        ordered: true,
        items: [{ children: [text("a")] }, { children: [text("b")] }],
      },
    ]);
  });

  it("starts a new list when the marker kind switches", () => {
    expect(parse("- a\n1. b")).toEqual([
      { type: "list", ordered: false, items: [{ children: [text("a")] }] },
      { type: "list", ordered: true, items: [{ children: [text("b")] }] },
    ]);
  });

  it("parses inline markup in items", () => {
    expect(parse("- **b**")).toEqual([
      {
        type: "list",
        ordered: false,
        items: [{ children: [{ type: "strong", children: [text("b")] }] }],
      },
    ]);
  });

  it("separates a list from an adjacent paragraph", () => {
    expect(parse("intro\n- a")).toEqual([
      { type: "paragraph", children: [text("intro")] },
      { type: "list", ordered: false, items: [{ children: [text("a")] }] },
    ]);
  });
});

describe("parse: nested lists (one level)", () => {
  it("nests indented items under the previous top-level item", () => {
    expect(parse("- a\n  - b\n  - c\n- d")).toEqual([
      {
        type: "list",
        ordered: false,
        items: [
          {
            children: [text("a")],
            sublist: {
              type: "list",
              ordered: false,
              items: [{ children: [text("b")] }, { children: [text("c")] }],
            },
          },
          { children: [text("d")] },
        ],
      },
    ]);
  });

  it("clamps deeper indentation to one sublist level", () => {
    expect(parse("- a\n  - b\n    - c")).toEqual([
      {
        type: "list",
        ordered: false,
        items: [
          {
            children: [text("a")],
            sublist: {
              type: "list",
              ordered: false,
              items: [{ children: [text("b")] }, { children: [text("c")] }],
            },
          },
        ],
      },
    ]);
  });

  it("allows an ordered sublist under an unordered list", () => {
    expect(parse("- a\n  1. b")).toEqual([
      {
        type: "list",
        ordered: false,
        items: [
          {
            children: [text("a")],
            sublist: {
              type: "list",
              ordered: true,
              items: [{ children: [text("b")] }],
            },
          },
        ],
      },
    ]);
  });

  it("treats an orphaned indented item as top-level", () => {
    expect(parse("  - a")).toEqual([
      { type: "list", ordered: false, items: [{ children: [text("a")] }] },
    ]);
  });
});
