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

/** kebab-case slug used for folders, R2 keys and metadata filenames. */
export function heroSlug(name) {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** MediaWiki page title fragment, e.g. "Nature's Prophet" -> "Nature's_Prophet". */
export function heroPageTitle(name) {
  return name.replace(/ /g, "_");
}

const tagOf = (node) => (node.rawTagName || "").toLowerCase();

/** Visible heading text, minus the "[edit]" section link. */
function headingText(h2) {
  const copy = parse(h2.outerHTML);
  for (const edit of copy.querySelectorAll(".mw-editsection")) edit.remove();
  return collapse(copy.text);
}

const collapse = (text) => text.replace(/\s+/g, " ").trim();

/** Transcript text for a voiceline <li>, minus markup, button and annotations. */
function extractTranscript(li) {
  const copy = parse(li.outerHTML).querySelector("li");
  // Nested sub-lists are their own voicelines; don't fold their text in here.
  for (const nested of copy.querySelectorAll("ul, ol")) nested.remove();
  for (const btn of copy.querySelectorAll("audio, a.ext-audiobutton"))
    btn.remove();
  const unused = copy.querySelector('abbr[title="Unused response"]') != null;
  for (const note of copy.querySelectorAll("small")) note.remove();
  return { transcript: collapse(copy.text), unused };
}

const enclosingLi = (node) => {
  for (let cur = node.parentNode; cur; cur = cur.parentNode) {
    if (tagOf(cur) === "li") return cur;
  }
  return null;
};

/**
 * Parse a "/Responses" article body into voicelines, deduped by mp3 URL.
 * @param {string} html rendered article HTML (MediaWiki parse `text`)
 * @returns {{filename:string, sourceUrl:string, transcript:string, categories:string[], unused:boolean}[]}
 */
export function parseResponses(html) {
  const root = parse(html);
  const byUrl = new Map();
  let category = null;

  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType !== 1) continue;
      const tag = tagOf(child);
      if (tag === "h2") {
        if (child.getAttribute("id") !== "mw-toc-heading") {
          category = headingText(child);
        }
      } else if (
        tag === "audio" &&
        (child.getAttribute("class") || "").includes("ext-audiobutton")
      ) {
        const sourceUrl = child.querySelector("source")?.getAttribute("src");
        if (sourceUrl) record(byUrl, sourceUrl, child, category);
        continue; // nothing useful below an <audio>
      }
      walk(child);
    }
  };
  walk(root);

  return [...byUrl.values()];
}

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
    filename: decodeURIComponent(sourceUrl.split("/").pop()),
    sourceUrl,
    transcript,
    categories: category ? [category] : [],
    unused,
  });
}
