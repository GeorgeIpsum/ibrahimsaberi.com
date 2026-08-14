import { describe, expect, it } from "vitest";
import rehypeCallouts from "../packages/rehype-callouts/src/index";

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

function run(tree: Node, options?: Parameters<typeof rehypeCallouts>[0]): Node {
  const transform = rehypeCallouts(options);
  transform(tree as unknown as Parameters<typeof transform>[0]);
  return tree;
}

describe("rehypeCallouts", () => {
  it("transforms a [!note] blockquote into a callout div", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("[!note]\nThis is the body.")])])]),
    );

    const div = at(tree, 0);
    expect(div.tagName).toBe("div");
    expect(div.properties?.className).toEqual([
      "markdown-callout",
      "markdown-callout-note",
    ]);
    expect(div.properties?.["data-callout-type"]).toBe("note");
    expect(div.properties?.["data-callout-name"]).toBe("note");
    expect(at(tree, 0, 1, 0).value).toBe("This is the body.");
  });

  it("renders the callout title with an icon and a label", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("[!note]\nbody")])])]),
    );

    const title = at(tree, 0, 0);
    expect(title.tagName).toBe("p");
    expect(String(title.properties?.className)).toContain(
      "markdown-callout-title",
    );
    expect(at(tree, 0, 0, 0).tagName).toBe("svg");
    expect(at(tree, 0, 0, 1).tagName).toBe("span");
    expect(at(tree, 0, 0, 1, 0).value).toBe("note");
  });

  it("matches the callout type case-insensitively", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("[!NOTE]\nbody")])])]),
    );

    expect(at(tree, 0).tagName).toBe("div");
    expect(at(tree, 0).properties?.["data-callout-type"]).toBe("note");
    expect(at(tree, 0).properties?.["data-callout-name"]).toBe("NOTE");
    expect(at(tree, 0, 0, 1, 0).value).toBe("NOTE");
  });

  it("transforms the [!note] + <br> form", () => {
    const tree = run(
      root([
        el("blockquote", [
          el("p", [text("[!note]"), el("br"), text("\nbody after break")]),
        ]),
      ]),
    );

    expect(at(tree, 0).tagName).toBe("div");
    expect(at(tree, 0, 1, 0).value).toBe("body after break");
  });

  it("leaves an unknown callout type untouched", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("[!bogus]\nbody")])])]),
    );
    expect(at(tree, 0).tagName).toBe("blockquote");
  });

  it("ignores a blockquote that is not at the document root", () => {
    const tree = run(
      root([el("div", [el("blockquote", [el("p", [text("[!note]\nbody")])])])]),
    );
    expect(at(tree, 0).tagName).toBe("div");
    expect(at(tree, 0, 0).tagName).toBe("blockquote");
  });

  it("ignores a plain blockquote with no callout marker", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("Just a normal quote.")])])]),
    );
    expect(at(tree, 0).tagName).toBe("blockquote");
  });

  it("accepts a custom callout type supplied via options", () => {
    const tree = run(
      root([el("blockquote", [el("p", [text("[!custom]\nbody")])])]),
      { calloutTypes: ["custom"] },
    );

    expect(at(tree, 0).tagName).toBe("div");
    expect(at(tree, 0).properties?.["data-callout-type"]).toBe("custom");
    // No icon is registered for a bare string type, so the title starts
    // directly with the label span.
    expect(at(tree, 0, 0, 0).tagName).toBe("span");
  });
});
