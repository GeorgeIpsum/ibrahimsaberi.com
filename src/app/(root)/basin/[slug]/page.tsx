import fm from "front-matter";
import { MDXRemote } from "next-mdx-remote/rsc";

export default async function Page({ params }: { params: { slug: string } }) {
  const data = await fetch(`http://localhost:3001/basin/${params.slug}`);

  if (!data || !data) {
    return ":(";
  }

  const drop = await data.json();

  return <MDXRemote source={drop.body} />;
}
