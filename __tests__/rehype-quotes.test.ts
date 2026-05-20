import { describe, expect, it } from "vitest";
import rehypeQuotes from "../packages/rehype-quotes/src/index";

type Node = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

const root = (children: Node[]): Node => ({ type: "root", children });
const el = (
  tagName: string,
  children: Node[] = [],
  properties: Record<string, unknown> = {},
): Node => ({ type: "element", tagName, properties, children });
const text = (value: string): Node => ({ type: "text", value });

// Walk a child-index path, throwing if any step is missing.
function at(node: Node, ...path: number[]): Node {
  let current: Node | undefined = node;
  for (const index of path) current = current?.children?.[index];
  if (!current) throw new Error(`no node at path [${path.join(", ")}]`);
  return current;
}

function run(tree: Node): Node {
  const transform = rehypeQuotes();
  transform(tree as unknown as Parameters<typeof transform>[0]);
  return tree;
}

describe("rehypeQuotes", () => {
  it("wraps a !QUOTE body in a <q> without producing a figure", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("!QUOTE Some quoted text.")])])]),
    );

    expect(at(tree, 0).tagName).toBe("blockquote");
    expect(at(tree, 0, 0).tagName).toBe("p");
    expect(at(tree, 0, 0, 0).tagName).toBe("q");
    // The !QUOTE marker is stripped from the wrapped text.
    expect(at(tree, 0, 0, 0, 0).value).toBe("Some quoted text.");
  });

  it("lifts a !VIA paragraph into a figcaption and wraps the quote in a figure", () => {
    const tree = run(
      root([
        el("blockquote", [
          el("p", [text("Just regular text.")]),
          el("p", [text("!VIA Author Name")]),
        ]),
      ]),
    );

    expect(at(tree, 0).tagName).toBe("figure");
    expect(at(tree, 0, 0).tagName).toBe("blockquote");
    expect(at(tree, 0, 1).tagName).toBe("figcaption");
    expect(at(tree, 0, 1, 0).value).toBe("Author Name");
    // Without !QUOTE the body paragraph keeps its plain text, no <q>.
    expect(at(tree, 0, 0, 0, 0).value).toBe("Just regular text.");
  });

  it("combines !QUOTE and !VIA into a figure with a quoted body", () => {
    const tree = run(
      root([
        el("blockquote", [
          el("p", [text("!QUOTE The quoted line.")]),
          el("p", [text("!VIA Author")]),
        ]),
      ]),
    );

    expect(at(tree, 0).tagName).toBe("figure");
    expect(at(tree, 0, 0).tagName).toBe("blockquote");
    expect(at(tree, 0, 0, 0, 0).tagName).toBe("q");
    expect(at(tree, 0, 0, 0, 0, 0).value).toBe("The quoted line.");
    expect(at(tree, 0, 1).tagName).toBe("figcaption");
    expect(at(tree, 0, 1, 0).value).toBe("Author");
  });

  it("wraps a !CITE link inside the citation in a <cite>", () => {
    const tree = run(
      root([
        el("blockquote", [
          el("p", [text("A body line.")]),
          el("p", [
            text("!VIA "),
            el("a", [text("!CITE Book Title")], { href: "https://book" }),
          ]),
        ]),
      ]),
    );

    const figcaption = at(tree, 0, 1);
    expect(figcaption.tagName).toBe("figcaption");
    expect(at(tree, 0, 1, 1).tagName).toBe("cite");
    expect(at(tree, 0, 1, 1, 0).tagName).toBe("a");
    expect(at(tree, 0, 1, 1, 0, 0).value).toBe("Book Title");
  });

  it("leaves a blockquote with no markers untouched", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("An ordinary quote.")])])]),
    );

    expect(at(tree, 0).tagName).toBe("blockquote");
    expect(at(tree, 0, 0, 0).value).toBe("An ordinary quote.");
  });

  it("requires the marker to be its own token", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("!QUOTED not a marker")])])]),
    );

    expect(at(tree, 0).tagName).toBe("blockquote");
    expect(at(tree, 0, 0, 0).value).toBe("!QUOTED not a marker");
  });

  it("does not treat a single-paragraph !VIA as a citation", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("!VIA Someone")])])]),
    );

    expect(at(tree, 0).tagName).toBe("blockquote");
    expect(at(tree, 0, 0, 0).value).toBe("!VIA Someone");
  });

  it("ignores a blockquote that is not at the document root", () => {
    const tree = run(
      root([
        el("section", [el("blockquote", [el("p", [text("!QUOTE nested")])])]),
      ]),
    );

    expect(at(tree, 0).tagName).toBe("section");
    expect(at(tree, 0, 0).tagName).toBe("blockquote");
    expect(at(tree, 0, 0, 0, 0).value).toBe("!QUOTE nested");
  });
});
