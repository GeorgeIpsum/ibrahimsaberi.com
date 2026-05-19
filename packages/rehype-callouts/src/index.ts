// Mostly (almost entirely) ripped off from rehype-github-alert
// original source: https://github.com/rehypejs/rehype-github/blob/main/packages/alert/lib/index.js

import type { ElementContent, Root } from "hast";
import { whitespace } from "hast-util-whitespace";
import { visit } from "unist-util-visit";

type CalloutType =
  | string
  | {
      name: string;
      aliases?: string[];
      icon?: {
        d: string | string[];
        size: number;
        name: string;
        strokeOrFill?: "stroke" | "fill";
        strokeWidth?: number;
      };
    };
type CalloutTypeObject = Extract<CalloutType, object>;

type RehypeCalloutsOptions = {
  calloutTypes: CalloutType[];
};

const DEFAULT_CALLOUTS: CalloutType[] = [
  {
    name: "note",
    icon: {
      d: "M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
      name: "octicon-info",
      size: 16,
      strokeOrFill: "fill",
    },
  },
  {
    name: "tip",
    icon: {
      d: "M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z",
      name: "octicon-light-bulb",
      size: 16,
    },
  },
  {
    name: "caution",
    icon: {
      d: "M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
      name: "octicon-stop",
      size: 16,
    },
  },
  {
    name: "important",
    icon: {
      d: "M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
      name: "octicon-report",
      size: 16,
    },
  },
  {
    name: "warning",
    icon: {
      d: "M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
      name: "octicon-alert",
      size: 16,
    },
  },
];

const nonAlphanumericRegex = /[^a-z0-9]+/gi;

export default function rehypeCallouts(
  options?: RehypeCalloutsOptions,
): (tree: Root) => void {
  const callouts = new Map<string, CalloutTypeObject>();

  DEFAULT_CALLOUTS.forEach((type) => {
    if (typeof type === "string") {
      callouts.set(type, { name: type });
    } else {
      callouts.set(type.name, type);
      type.aliases?.forEach((alias) => {
        callouts.set(alias, type);
      });
    }
  });

  const calloutTypes = options?.calloutTypes ?? [];
  calloutTypes.forEach((type) => {
    if (typeof type === "string") {
      callouts.set(type, { name: type });
    } else {
      callouts.set(type.name, type);
      type.aliases?.forEach((alias) => {
        callouts.set(alias, type);
      });
    }
  });

  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName !== "blockquote" ||
        typeof index !== "number" ||
        !parent ||
        parent.type !== "root"
      ) {
        return;
      }

      let headIndex = 0;

      while (
        headIndex < node.children.length &&
        whitespace(node.children[headIndex])
      ) {
        headIndex++;
      }

      const head = node.children[headIndex];

      // Must start with a `p`.
      if (!head || head.type !== "element" || head.tagName !== "p") return;

      // Must start with a `![`.
      const text = head.children[0];
      if (!text || text.type !== "text" || !text.value.startsWith("[!")) return;

      // Must have `]`.
      const end = text.value.indexOf("]");
      if (end === -1) return;

      const name = text.value.slice(2, end);

      // try all cases (TODO: revisit if this is a dumb idea based on usage)
      const knownCallout =
        callouts.get(name) ??
        callouts.get(name.toUpperCase()) ??
        callouts.get(name.toLowerCase());

      if (!knownCallout) return;

      if (end + 1 === text.value.length) {
        // Has to be a `<br>`.
        const next = head.children[1];

        if (next) {
          if (next.type !== "element" || next.tagName !== "br") return;
          // No next sibling? Exit too.
          if (!head.children[2]) return;
          // Drop the entire `[!note]` text *and* the `<br>`.
          head.children = head.children.slice(2);
          // Drop the `\n` that typically (in markdown) follows `<br>`.
          const node = head.children[0];
          if (node && node.type === "text" && node.value.charAt(0) === "\n") {
            node.value = node.value.slice(1);
          }
        } else {
          let skipped = false;

          // Skip past whitespace.
          while (
            headIndex + 1 < node.children.length &&
            whitespace(node.children[headIndex + 1])
          ) {
            skipped = true;
            headIndex++;
          }

          // Exit if there’s no following element.
          if (
            headIndex + 1 === node.children.length ||
            node.children[headIndex + 1].type !== "element"
          ) {
            return;
          }

          // Without whitespace,
          // we still want to skip the paragraph to drop the `[!note]`.
          if (!skipped) headIndex++;
        }
      } else if (
        text.value.charAt(end + 1) === "\n" &&
        (end + 2 === text.value.length ||
          !whitespace(text.value.slice(end + 2)))
      ) {
        // Drop the `[!note]` from the `text`.
        text.value = text.value.slice(end + 2);
      } else {
        return;
      }

      // TODO: this will also be a source of weirdness
      const displayName = knownCallout.name !== name ? name : knownCallout.name;

      const calloutParagraphChildren: ElementContent[] = [];

      if (knownCallout.icon) {
        const iconPaths = Array.isArray(knownCallout.icon.d)
          ? knownCallout.icon.d
          : [knownCallout.icon.d];
        const svgElement: ElementContent = {
          type: "element",
          tagName: "svg",
          properties: {
            className: [
              "markdown-callout-icon",
              `markdown-callout-${knownCallout.name.toLowerCase().replaceAll(nonAlphanumericRegex, "-")}-icon`,
            ],
            viewBox: `0 0 ${knownCallout.icon.size} ${knownCallout.icon.size}`,
            version: "1.1",
            width: "20",
            height: "20",
            strokeWidth: `${knownCallout.icon.strokeWidth ?? "2"}`,
            stroke:
              knownCallout.icon.strokeOrFill === "stroke"
                ? "currentColor"
                : "none",
            fill:
              knownCallout.icon.strokeOrFill === "fill"
                ? "currentColor"
                : "none",
            ariaHidden: "true",
          },
          children: iconPaths.map((d) => ({
            type: "element",
            tagName: "path",
            properties: { d },
            children: [],
          })),
        };

        calloutParagraphChildren.push(svgElement);
      }

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          className: [
            "markdown-callout",
            "markdown-callout-" +
              knownCallout.name
                .toLowerCase()
                .replaceAll(nonAlphanumericRegex, "-"),
          ],
          "data-callout-type": knownCallout.name,
          "data-callout-name": displayName,
        },
        children: [
          {
            type: "element",
            tagName: "p",
            properties: {
              className: "markdown-callout-title flex items-center gap-2",
            },
            children: calloutParagraphChildren.concat([
              {
                type: "element",
                tagName: "span",
                properties: { className: "markdown-callout-title-text" },
                children: [{ type: "text", value: displayName }],
              },
            ]),
          },
          ...node.children.slice(headIndex),
        ],
      };
    });
  };
}
