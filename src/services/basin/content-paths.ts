import path from "node:path";

// Every published post's filename is `YYYY-MM-DD-<slug>.mdx`. The filename
// date is the source of truth for publishedAt and sort order.
const FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})-(.+)\.mdx$/;
// A folder counts as a year folder only if it is exactly four digits, and a
// month folder only if exactly two digits. Numeric-shaped-but-wrong is an
// invalid placement; non-numeric is an unrecognized location (skipped).
const YEAR_PATTERN = /^\d{4}$/;
const MONTH_PATTERN = /^\d{2}$/;

export type ClassifiedPath =
  | { kind: "post"; file: string; dateStr: string; slug: string }
  | { kind: "skip" }
  | { kind: "invalid"; file: string; reason: string };

/**
 * Classify a path relative to `src/content`:
 *  - `post`    — an indexable post at a valid location
 *  - `skip`    — a non-post file or a post-named file in an unrecognized
 *                location (non-numeric folder, depth >= 3)
 *  - `invalid` — a post-named file whose year/month folders contradict the
 *                filename date; the caller must fail the build on these
 *
 * `file` is the path normalized to POSIX separators, safe for both
 * `path.join` and the `import("@/content/...")` specifier.
 */
export function classifyContentPath(relativePath: string): ClassifiedPath {
  const segments = relativePath.split(path.sep);
  const filename = segments[segments.length - 1];
  const dirs = segments.slice(0, -1);
  const file = segments.join("/");

  const match = filename.match(FILE_PATTERN);
  if (!match) return { kind: "skip" };
  const [, dateStr, slug] = match;
  const [year, month] = dateStr.split("-");

  if (dirs.length === 0) {
    return { kind: "post", file, dateStr, slug };
  }

  if (dirs.length === 1) {
    if (!YEAR_PATTERN.test(dirs[0])) return { kind: "skip" };
    if (dirs[0] !== year) {
      return {
        kind: "invalid",
        file,
        reason: `folder year "${dirs[0]}" does not match filename date "${dateStr}"`,
      };
    }
    return { kind: "post", file, dateStr, slug };
  }

  if (dirs.length === 2) {
    if (!YEAR_PATTERN.test(dirs[0]) || !MONTH_PATTERN.test(dirs[1])) {
      return { kind: "skip" };
    }
    if (dirs[0] !== year || dirs[1] !== month) {
      return {
        kind: "invalid",
        file,
        reason: `folder "${dirs[0]}/${dirs[1]}" does not match filename date "${dateStr}"`,
      };
    }
    return { kind: "post", file, dateStr, slug };
  }

  return { kind: "skip" };
}
