import { whitespace } from "hast-util-whitespace";
import { visit } from "unist-util-visit";
const QUOTE_MARKER = "!QUOTE";
const VIA_MARKER = "!VIA";
const CITE_MARKER = "!CITE";
// The first child of `node` if it is a text node, else undefined.
function leadingText(node) {
    const first = node.children[0];
    return first && first.type === "text" ? first : undefined;
}
// First / last non-whitespace child of `node`, when that child is an element.
function firstElement(node) {
    for (const child of node.children) {
        if (whitespace(child))
            continue;
        return child.type === "element" ? child : undefined;
    }
    return undefined;
}
function lastElement(node) {
    for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i];
        if (whitespace(child))
            continue;
        return child.type === "element" ? child : undefined;
    }
    return undefined;
}
// Whether `value` opens with `marker` as a whole token — the marker followed
// by whitespace or the end of the text (same convention as `!FIGCAP`).
function startsWithMarker(value, marker) {
    if (!value.startsWith(marker))
        return false;
    const after = value.charAt(marker.length);
    return after === "" || /\s/.test(after);
}
// Drop `marker` and the whitespace following it from the start of `node`.
function stripMarker(node, marker) {
    node.value = node.value.slice(marker.length).replace(/^\s+/, "");
}
// Within a figcaption, wrap any `<a>` whose link text opens with `!CITE` in a
// `<cite>` element, stripping the marker.
function wrapCiteLinks(figcaption) {
    visit(figcaption, "element", (link, index, parent) => {
        if (link.tagName !== "a" || typeof index !== "number" || !parent)
            return;
        const text = leadingText(link);
        if (!text || !startsWithMarker(text.value, CITE_MARKER))
            return;
        stripMarker(text, CITE_MARKER);
        parent.children[index] = {
            type: "element",
            tagName: "cite",
            properties: {},
            children: [link],
        };
    });
}
export default function rehypeQuotes() {
    return (tree) => {
        visit(tree, "element", (node, index, parent) => {
            if (node.tagName !== "blockquote" ||
                typeof index !== "number" ||
                !parent ||
                parent.type !== "root") {
                return;
            }
            // `!QUOTE` opens the blockquote's first paragraph.
            let isQuote = false;
            const firstBlock = firstElement(node);
            if (firstBlock && firstBlock.tagName === "p") {
                const text = leadingText(firstBlock);
                if (text && startsWithMarker(text.value, QUOTE_MARKER)) {
                    stripMarker(text, QUOTE_MARKER);
                    isQuote = true;
                }
            }
            // `!VIA` opens the blockquote's last paragraph — the citation.
            let citation;
            const lastBlock = lastElement(node);
            if (lastBlock && lastBlock.tagName === "p" && lastBlock !== firstBlock) {
                const text = leadingText(lastBlock);
                if (text && startsWithMarker(text.value, VIA_MARKER)) {
                    stripMarker(text, VIA_MARKER);
                    citation = lastBlock;
                }
            }
            if (!isQuote && !citation)
                return;
            // Lift the citation paragraph out of the blockquote body.
            if (citation) {
                const ci = node.children.indexOf(citation);
                if (ci !== -1)
                    node.children.splice(ci, 1);
            }
            // Wrap each remaining body paragraph's inline content in `<q>`.
            if (isQuote) {
                for (const child of node.children) {
                    if (child.type === "element" && child.tagName === "p") {
                        child.children = [
                            {
                                type: "element",
                                tagName: "q",
                                properties: {},
                                children: child.children,
                            },
                        ];
                    }
                }
            }
            // Wrap the blockquote in a `<figure>` with the citation as `<figcaption>`.
            if (citation) {
                const figcaption = {
                    type: "element",
                    tagName: "figcaption",
                    properties: {},
                    children: citation.children,
                };
                wrapCiteLinks(figcaption);
                parent.children[index] = {
                    type: "element",
                    tagName: "figure",
                    properties: {},
                    children: [node, figcaption],
                };
            }
        });
    };
}
