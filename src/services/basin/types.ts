import { type } from "arktype";

export const FrontmatterSchema = type({
  title: "string",
  "author?": "string",
  publishedAt: "string",
  "blurb?": "string",
  "linkTitle?": "string",
  "tags?": "string[]",
  "draft?": "boolean",
});

export type Frontmatter = typeof FrontmatterSchema.infer;

export type Post = {
  slug: string;
  frontmatter: Frontmatter;
  Content: React.ComponentType;
};

export type PostListEntry = {
  slug: string;
  frontmatter: Frontmatter;
};
