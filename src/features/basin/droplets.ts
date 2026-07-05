import {
  countSectionPosts,
  type ListPostsOptions,
  listSectionPosts,
  loadSectionPost,
  loadSectionPostMeta,
} from "./load-section";

export const listDroplets = (opts?: ListPostsOptions) =>
  listSectionPosts("droplets", opts);

export const countDroplets = (opts?: Pick<ListPostsOptions, "tag">) =>
  countSectionPosts("droplets", opts);

export const loadDropletMeta = (slug: string) =>
  loadSectionPostMeta("droplets", slug);

export const loadDroplet = (slug: string) => loadSectionPost("droplets", slug);
