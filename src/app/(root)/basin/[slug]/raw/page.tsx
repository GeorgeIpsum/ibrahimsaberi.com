import { listPosts } from "@/services/basin/load-post";

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function Page() {
  return null;
}
