// Initial write inspired by rehype-figure-title
// original source: https://github.com/futuraprime/rehype-figure-title/blob/main/index.js
import { whitespace } from "hast-util-whitespace";
import { visit } from "unist-util-visit";
const FIGCAP_MARKER = "!FIGCAP";
// The single non-whitespace child of `node` if it is an `img`, else undefined.
// Used to confirm a paragraph holds nothing but a standalone image.
function loneImage(node) {
    let found;
    for (const child of node.children) {
        if (whitespace(child))
            continue;
        if (found || child.type !== "element" || child.tagName !== "img") {
            return undefined;
        }
        found = child;
    }
    return found;
}
// If `blockquote` opens with a paragraph whose first text begins with the
// `!FIGCAP` marker token, return that text node so the caller can strip it.
function figcapMarkerNode(blockquote) {
    const firstBlock = blockquote.children.find((c) => !whitespace(c));
    if (!firstBlock ||
        firstBlock.type !== "element" ||
        firstBlock.tagName !== "p") {
        return undefined;
    }
    const firstText = firstBlock.children[0];
    if (!firstText || firstText.type !== "text")
        return undefined;
    if (!firstText.value.startsWith(FIGCAP_MARKER))
        return undefined;
    // The marker must be its own token — followed by whitespace or end of text.
    const after = firstText.value.charAt(FIGCAP_MARKER.length);
    if (after !== "" && !/\s/.test(after))
        return undefined;
    return firstText;
}
export default function rehypeFigcaptions() {
    return (tree) => {
        visit(tree, "element", (node, index, parent) => {
            if (node.tagName !== "blockquote" ||
                typeof index !== "number" ||
                !parent ||
                parent.type !== "root") {
                return;
            }
            const marker = figcapMarkerNode(node);
            if (!marker)
                return;
            // Walk back over whitespace to the immediately preceding sibling; to
            // qualify it must be a paragraph holding only a single image.
            let pIndex = index - 1;
            while (pIndex >= 0 && whitespace(parent.children[pIndex]))
                pIndex--;
            if (pIndex < 0)
                return;
            const imageParagraph = parent.children[pIndex];
            if (imageParagraph.type !== "element" ||
                imageParagraph.tagName !== "p") {
                return;
            }
            const img = loneImage(imageParagraph);
            if (!img)
                return;
            // Drop the `!FIGCAP` marker (and the whitespace after it) so the
            // blockquote's own content becomes the caption.
            marker.value = marker.value
                .slice(FIGCAP_MARKER.length)
                .replace(/^\s+/, "");
            const figure = {
                type: "element",
                tagName: "figure",
                properties: {},
                children: [
                    img,
                    {
                        type: "element",
                        tagName: "figcaption",
                        properties: {},
                        children: node.children,
                    },
                ],
            };
            // Replace the image paragraph with the figure and drop the blockquote
            // (plus any whitespace that sat between them).
            parent.children.splice(pIndex, index - pIndex + 1, figure);
            return pIndex;
        });
    };
}
