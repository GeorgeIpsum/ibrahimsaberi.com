import { MDXRemote } from "next-mdx-remote/rsc";
import Router from "next/router";

import env from "@/env.mjs";

export default async function Page({ params }: { params: { slug: string } }) {
  const data = null;

  if (!data || !data) {
    return ":(";
  }

  console.log(data);

  return <MDXRemote source={data} />;
}
