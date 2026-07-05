import {
  countSectionPosts,
  type ListPostsOptions,
  listSectionPosts,
  listSectionTags,
  loadSectionPost,
  loadSectionPostMeta,
} from "./load-section";

export const listRipples = (opts?: ListPostsOptions) =>
  listSectionPosts("ripples", opts);

export const countRipples = (opts?: Pick<ListPostsOptions, "tag">) =>
  countSectionPosts("ripples", opts);

export const listRippleTags = () => listSectionTags("ripples");

export const loadRippleMeta = (slug: string) =>
  loadSectionPostMeta("ripples", slug);

export const loadRipple = (slug: string) => loadSectionPost("ripples", slug);
