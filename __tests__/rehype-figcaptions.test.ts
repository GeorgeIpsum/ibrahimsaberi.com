import { describe, expect, it } from "vitest";
import rehypeFigcaptions from "../packages/rehype-figcaptions/src/index";

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
const img = (src: string): Node => el("img", [], { src, alt: "alt text" });

// Walk a child-index path, throwing if any step is missing.
function at(node: Node, ...path: number[]): Node {
  let current: Node | undefined = node;
  for (const index of path) current = current?.children?.[index];
  if (!current) throw new Error(`no node at path [${path.join(", ")}]`);
  return current;
}

function run(tree: Node): Node {
  const transform = rehypeFigcaptions();
  transform(tree as unknown as Parameters<typeof transform>[0]);
  return tree;
}

describe("rehypeFigcaptions", () => {
  it("wraps a lone image followed by a !FIGCAP blockquote in a figure", () => {
    const tree = run(
      root([
        el("p", [img("/cat.png")]),
        el("blockquote", [el("p", [text("!FIGCAP A wild cat.")])]),
      ]),
    );

    expect(tree.children?.length).toBe(1);
    expect(at(tree, 0).tagName).toBe("figure");
    expect(at(tree, 0, 0).tagName).toBe("img");
    expect(at(tree, 0, 0).properties?.src).toBe("/cat.png");
    expect(at(tree, 0, 1).tagName).toBe("figcaption");
  });

  it("strips the !FIGCAP marker and following whitespace from the caption", () => {
    const tree = run(
      root([
        el("p", [img("/cat.png")]),
        el("blockquote", [el("p", [text("!FIGCAP   A wild cat.")])]),
      ]),
    );
    expect(at(tree, 0, 1, 0, 0).value).toBe("A wild cat.");
  });

  it("tolerates whitespace between the image paragraph and the blockquote", () => {
    const tree = run(
      root([
        el("p", [img("/cat.png")]),
        text("\n"),
        el("blockquote", [el("p", [text("!FIGCAP caption")])]),
      ]),
    );
    expect(tree.children?.length).toBe(1);
    expect(at(tree, 0).tagName).toBe("figure");
  });

  it("ignores a !FIGCAP blockquote with no preceding sibling", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("!FIGCAP caption")])])]),
    );
    expect(at(tree, 0).tagName).toBe("blockquote");
  });

  it("ignores it when the preceding paragraph holds more than an image", () => {
    const tree = run(
      root([
        el("p", [img("/cat.png"), text("extra text")]),
        el("blockquote", [el("p", [text("!FIGCAP caption")])]),
      ]),
    );
    expect(tree.children?.length).toBe(2);
    expect(at(tree, 0).tagName).toBe("p");
  });

  it("ignores it when the preceding sibling is not a paragraph", () => {
    const tree = run(
      root([
        el("h2", [text("Heading")]),
        el("blockquote", [el("p", [text("!FIGCAP caption")])]),
      ]),
    );
    expect(tree.children?.length).toBe(2);
    expect(at(tree, 1).tagName).toBe("blockquote");
  });

  it("ignores a blockquote without the !FIGCAP marker", () => {
    const tree = run(
      root([
        el("p", [img("/cat.png")]),
        el("blockquote", [el("p", [text("Just a caption-less quote.")])]),
      ]),
    );
    expect(tree.children?.length).toBe(2);
  });

  it("requires the marker to be its own token", () => {
    const tree = run(
      root([
        el("p", [img("/cat.png")]),
        el("blockquote", [el("p", [text("!FIGCAPTION not a marker")])]),
      ]),
    );
    expect(tree.children?.length).toBe(2);
    expect(at(tree, 1).tagName).toBe("blockquote");
  });
});
