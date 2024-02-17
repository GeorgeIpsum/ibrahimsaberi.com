import { MDXRemote } from "next-mdx-remote/rsc";
import Router from "next/router";

import env from "@/env.mjs";

export default async function Page({ params }: { params: { slug: string } }) {
  const data = await fetch(`http://localhost:3001/basin/${params.slug}`);

  if (!data || !data) {
    return ":(";
  }

  const drop = await data.json();

  return <MDXRemote source={drop.body} />;
}
