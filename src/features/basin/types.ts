import { type } from "arktype";

export const RippleFrontmatterSchema = type({
  title: "string",
  "author?": "string",
  publishedAt: "string",
  "blurb?": "string",
  "linkTitle?": "string",
  "tags?": "string[]",
  "draft?": "boolean",
});

export const DropletFrontmatterSchema = type({
  "title?": "string",
  publishedAt: "string",
  "tags?": "string[]",
  "draft?": "boolean",
});

export type RippleFrontmatter = typeof RippleFrontmatterSchema.infer;
export type DropletFrontmatter = typeof DropletFrontmatterSchema.infer;

// Kept as an alias so existing ripple-only call sites keep reading naturally.
export type Frontmatter = RippleFrontmatter;

export type Post<F = RippleFrontmatter> = {
  slug: string;
  frontmatter: F;
  Content: React.ComponentType;
};

export type PostListEntry<F = RippleFrontmatter> = {
  slug: string;
  frontmatter: F;
};
