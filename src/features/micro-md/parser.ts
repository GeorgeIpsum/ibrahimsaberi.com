export type BlockNode =
  | { type: "paragraph"; children: InlineNode[] }
  | ListNode;

export type ListNode = { type: "list"; ordered: boolean; items: ListItem[] };

export type ListItem = { children: InlineNode[]; sublist?: ListNode };

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "del"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: InlineNode[] }
  | { type: "break" };

const PUNCTUATION = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const AUTOLINK_TRAILERS = ".,;:!?)";

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

// Characters the inline scanner stops at; everything between them is copied
// in one slice. `h` is included so autolinks can be spotted without a
// separate pass.
function nextSpecial(src: string, from: number, end: number): number {
  for (let i = from; i < end; i++) {
    const c = src.charCodeAt(i);
    if (
      c === 42 || // *
      c === 95 || // _
      c === 126 || // ~
      c === 96 || // `
      c === 91 || // [
      c === 92 || // \
      c === 104 // h
    ) {
      return i;
    }
  }
  return end;
}

// Find `delim` acting as a closer (preceded by non-whitespace) in
// src[from, end), skipping escaped characters and code spans.
function findCloser(
  src: string,
  from: number,
  end: number,
  delim: string,
): number {
  let i = from;
  while (i < end) {
    const ch = src[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "`") {
      const close = src.indexOf("`", i + 1);
      if (close !== -1 && close < end) {
        i = close + 1;
        continue;
      }
    }
    if (
      i + delim.length <= end &&
      src.startsWith(delim, i) &&
      i > from &&
      !isWhitespace(src[i - 1])
    ) {
      return i;
    }
    i++;
  }
  return -1;
}

type InlineMatch = { node: InlineNode; next: number };

function tryEmphasis(
  src: string,
  pos: number,
  end: number,
): InlineMatch | null {
  const c = src[pos];
  let run = 1;
  while (pos + run < end && src[pos + run] === c) run++;

  if (run >= 3 && c !== "~") {
    const innerStart = pos + 3;
    if (innerStart < end && !isWhitespace(src[innerStart])) {
      const close = findCloser(src, innerStart, end, c + c + c);
      if (close !== -1) {
        return {
          node: {
            type: "strong",
            children: [
              { type: "em", children: scanInline(src, innerStart, close) },
            ],
          },
          next: close + 3,
        };
      }
    }
  }

  if (run >= 2) {
    const innerStart = pos + 2;
    if (innerStart < end && !isWhitespace(src[innerStart])) {
      const close = findCloser(src, innerStart, end, c + c);
      if (close !== -1) {
        return {
          node: {
            type: c === "~" ? "del" : "strong",
            children: scanInline(src, innerStart, close),
          },
          next: close + 2,
        };
      }
    }
    return null;
  }

  const innerStart = pos + 1;
  if (innerStart < end && !isWhitespace(src[innerStart])) {
    const close = findCloser(src, innerStart, end, c);
    if (close !== -1) {
      return {
        node: { type: "em", children: scanInline(src, innerStart, close) },
        next: close + 1,
      };
    }
  }
  return null;
}

function tryLink(src: string, pos: number, end: number): InlineMatch | null {
  let closeBracket = -1;
  for (let i = pos + 1; i < end; i++) {
    const ch = src[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "]") {
      closeBracket = i;
      break;
    }
  }
  if (closeBracket === -1) return null;
  if (closeBracket + 1 >= end || src[closeBracket + 1] !== "(") return null;
  const closeParen = src.indexOf(")", closeBracket + 2);
  if (closeParen === -1 || closeParen >= end) return null;
  return {
    node: {
      type: "link",
      href: src.slice(closeBracket + 2, closeParen),
      children: scanInline(src, pos + 1, closeBracket),
    },
    next: closeParen + 1,
  };
}

function tryAutolink(
  src: string,
  pos: number,
  end: number,
): InlineMatch | null {
  let scheme = "";
  if (pos + 8 <= end && src.startsWith("https://", pos)) scheme = "https://";
  else if (pos + 7 <= end && src.startsWith("http://", pos)) scheme = "http://";
  else return null;

  let i = pos;
  while (i < end && !isWhitespace(src[i])) i++;
  let urlEnd = i;
  while (urlEnd > pos && AUTOLINK_TRAILERS.includes(src[urlEnd - 1])) urlEnd--;
  if (urlEnd <= pos + scheme.length) return null;

  const href = src.slice(pos, urlEnd);
  return {
    node: { type: "link", href, children: [{ type: "text", value: href }] },
    next: urlEnd,
  };
}

function scanInline(src: string, start: number, end: number): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      nodes.push({ type: "text", value: buf });
      buf = "";
    }
  };
  const emit = (match: InlineMatch) => {
    flush();
    nodes.push(match.node);
    pos = match.next;
  };

  let pos = start;
  while (pos < end) {
    const special = nextSpecial(src, pos, end);
    if (special > pos) {
      buf += src.slice(pos, special);
      pos = special;
      if (pos >= end) break;
    }
    const ch = src[pos];

    if (ch === "\\") {
      if (pos + 1 < end && PUNCTUATION.includes(src[pos + 1])) {
        buf += src[pos + 1];
        pos += 2;
      } else {
        buf += "\\";
        pos += 1;
      }
      continue;
    }

    if (ch === "`") {
      const close = src.indexOf("`", pos + 1);
      if (close !== -1 && close < end) {
        flush();
        nodes.push({ type: "code", value: src.slice(pos + 1, close) });
        pos = close + 1;
      } else {
        buf += "`";
        pos += 1;
      }
      continue;
    }

    if (ch === "[") {
      const link = tryLink(src, pos, end);
      if (link) emit(link);
      else {
        buf += "[";
        pos += 1;
      }
      continue;
    }

    if (ch === "h") {
      const afterBoundary = pos === start || isWhitespace(src[pos - 1]);
      const auto = afterBoundary ? tryAutolink(src, pos, end) : null;
      if (auto) emit(auto);
      else {
        buf += "h";
        pos += 1;
      }
      continue;
    }

    // * _ ~
    if (ch === "~" && (pos + 1 >= end || src[pos + 1] !== "~")) {
      buf += "~";
      pos += 1;
      continue;
    }
    const emphasis = tryEmphasis(src, pos, end);
    if (emphasis) emit(emphasis);
    else {
      let run = 1;
      while (pos + run < end && src[pos + run] === ch) run++;
      buf += src.slice(pos, pos + run);
      pos += run;
    }
  }

  flush();
  return nodes;
}

export function parseInline(input: string): InlineNode[] {
  return scanInline(input, 0, input.length);
}

type ListMarker = { ordered: boolean; indent: number; content: string };

function parseListMarker(line: string): ListMarker | null {
  let i = 0;
  let indent = 0;
  while (i < line.length) {
    if (line[i] === " ") indent += 1;
    else if (line[i] === "\t") indent += 2;
    else break;
    i++;
  }

  const ch = line[i];
  if ((ch === "-" || ch === "*") && line[i + 1] === " ") {
    return { ordered: false, indent, content: line.slice(i + 2).trim() };
  }
  if (ch >= "0" && ch <= "9") {
    let j = i + 1;
    while (j < line.length && line[j] >= "0" && line[j] <= "9") j++;
    if (line[j] === "." && line[j + 1] === " ") {
      return { ordered: true, indent, content: line.slice(j + 2).trim() };
    }
  }
  return null;
}

export function parse(input: string): BlockNode[] {
  const blocks: BlockNode[] = [];
  const lines = input.split("\n");

  let paragraph: string[] = [];
  let list: ListNode | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const children: InlineNode[] = [];
    paragraph.forEach((line, i) => {
      children.push(...parseInline(line));
      if (i < paragraph.length - 1) children.push({ type: "break" });
    });
    blocks.push({ type: "paragraph", children });
    paragraph = [];
  };

  for (const raw of lines) {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;

    if (line.trim() === "") {
      flushParagraph();
      list = null;
      continue;
    }

    const marker = parseListMarker(line);
    if (marker) {
      flushParagraph();
      const item: ListItem = { children: parseInline(marker.content) };

      // 2+ spaces of indent nests one level under the previous top-level
      // item; anything deeper clamps to that same level.
      if (marker.indent >= 2 && list && list.items.length > 0) {
        const parent = list.items[list.items.length - 1];
        parent.sublist ??= { type: "list", ordered: marker.ordered, items: [] };
        parent.sublist.items.push(item);
        continue;
      }

      if (!list || list.ordered !== marker.ordered) {
        list = { type: "list", ordered: marker.ordered, items: [] };
        blocks.push(list);
      }
      list.items.push(item);
      continue;
    }

    paragraph.push(line);
    list = null;
  }

  flushParagraph();
  return blocks;
}
