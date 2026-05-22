import { readFile } from "node:fs/promises";
import path from "node:path";
import { listPosts, loadPostMeta } from "@/services/basin/load-post";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params;
  const meta = await loadPostMeta(slug);
  if (!meta)
    return new Response("There is no post here. There was never a post here.", {
      status: 404,
    });
  const raw = await readFile(
    path.join(process.cwd(), "src/content", `${meta.basename}.mdx`),
    "utf-8",
  );
  return new Response(raw, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
