import { MDXRemote } from "next-mdx-remote/rsc";

import getDrop from "../drop";

export default async function Page({ params }: { params: { slug: string } }) {
  const data = await getDrop(params.slug);
  if (!data || !data) {
    return ":(";
  }

  const drop = await data.json();

  return <MDXRemote source={drop.body} />;
}
