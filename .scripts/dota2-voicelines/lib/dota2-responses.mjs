// Parsing helpers for Liquipedia Dota 2 "/Responses" pages.
//
// The MediaWiki `action=parse` endpoint returns the rendered article HTML. Each
// voiceline is a list item shaped like:
//
//   <li><span><audio class="ext-audiobutton"><source src="…mp3"/></audio>
//       <a class="ext-audiobutton">▶️</a></span> transcript text</li>
//
// grouped under <h2> section headings. Some transcripts carry editorial markup
// we strip: a leading <abbr title="Unused response">u</abbr> marker and
// <small> usage notes.

import { parse } from "node-html-parser";

/**
 * One parsed voiceline.
 * @typedef {object} Voiceline
 * @property {string} filename Decoded mp3 filename.
 * @property {string} sourceUrl Absolute mp3 URL.
 * @property {string} transcript Cleaned transcript text.
 * @property {string[]} categories Section headings the line appears under.
 * @property {boolean} unused Whether it is flagged as an unused response.
 */

/**
 * kebab-case slug used for folders, R2 keys and metadata filenames.
 * @param {string} name
 * @returns {string}
 */
export function heroSlug(name) {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * MediaWiki page title fragment, e.g. "Nature's Prophet" -> "Nature's_Prophet".
 * @param {string} name
 * @returns {string}
 */
export function heroPageTitle(name) {
  return name.replace(/ /g, "_");
}

/** @param {import("node-html-parser").Node} node */
const tagOf = (node) => (node.rawTagName || "").toLowerCase();

/**
 * Visible heading text, minus the "[edit]" section link.
 * @param {import("node-html-parser").HTMLElement} h2
 * @returns {string}
 */
function headingText(h2) {
  const copy = parse(h2.outerHTML);
  for (const edit of copy.querySelectorAll(".mw-editsection")) edit.remove();
  return collapse(copy.text);
}

/** @param {string} text */
const collapse = (text) => text.replace(/\s+/g, " ").trim();

/**
 * Transcript text for a voiceline <li>, minus markup, button and annotations.
 * @param {import("node-html-parser").HTMLElement} li
 * @returns {{ transcript: string, unused: boolean }}
 */
function extractTranscript(li) {
  const copy = parse(li.outerHTML).querySelector("li");
  if (!copy) return { transcript: "", unused: false };
  // Nested sub-lists are their own voicelines; don't fold their text in here.
  for (const nested of copy.querySelectorAll("ul, ol")) nested.remove();
  for (const btn of copy.querySelectorAll("audio, a.ext-audiobutton"))
    btn.remove();
  const unused = copy.querySelector('abbr[title="Unused response"]') != null;
  for (const note of copy.querySelectorAll("small")) note.remove();
  return { transcript: collapse(copy.text), unused };
}

/**
 * Nearest ancestor <li> of a node, or null.
 * @param {import("node-html-parser").Node} node
 * @returns {import("node-html-parser").HTMLElement | null}
 */
const enclosingLi = (node) => {
  for (let cur = node.parentNode; cur; cur = cur.parentNode) {
    if (tagOf(cur) === "li") return cur;
  }
  return null;
};

/**
 * Parse a "/Responses" article body into voicelines, deduped by mp3 URL.
 * @param {string} html rendered article HTML (MediaWiki parse `text`)
 * @returns {Voiceline[]}
 */
export function parseResponses(html) {
  const root = parse(html);
  /** @type {Map<string, Voiceline>} */
  const byUrl = new Map();
  /** @type {string | null} */
  let category = null;

  /** @param {import("node-html-parser").HTMLElement} node */
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType !== 1) continue;
      // nodeType 1 == element; childNodes is typed as the Node base class.
      const el = /** @type {import("node-html-parser").HTMLElement} */ (child);
      const tag = tagOf(el);
      if (tag === "h2") {
        if (el.getAttribute("id") !== "mw-toc-heading") {
          category = headingText(el);
        }
      } else if (
        tag === "audio" &&
        (el.getAttribute("class") || "").includes("ext-audiobutton")
      ) {
        const sourceUrl = el.querySelector("source")?.getAttribute("src");
        if (sourceUrl) record(byUrl, sourceUrl, el, category);
        continue; // nothing useful below an <audio>
      }
      walk(el);
    }
  };
  walk(root);

  return [...byUrl.values()];
}

/**
 * Record a voiceline by its mp3 URL, merging categories on duplicates.
 * @param {Map<string, Voiceline>} byUrl
 * @param {string} sourceUrl
 * @param {import("node-html-parser").HTMLElement} audio
 * @param {string | null} category
 */
function record(byUrl, sourceUrl, audio, category) {
  const existing = byUrl.get(sourceUrl);
  if (existing) {
    if (category && !existing.categories.includes(category)) {
      existing.categories.push(category);
    }
    return;
  }
  const li = enclosingLi(audio);
  const { transcript, unused } = li
    ? extractTranscript(li)
    : { transcript: "", unused: false };
  byUrl.set(sourceUrl, {
    filename: decodeURIComponent(sourceUrl.split("/").pop() ?? ""),
    sourceUrl,
    transcript,
    categories: category ? [category] : [],
    unused,
  });
}
