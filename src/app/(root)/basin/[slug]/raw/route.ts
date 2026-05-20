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
  const { basename } = await loadPostMeta(slug);
  const raw = await readFile(
    path.join(process.cwd(), "src/content", `${basename}.mdx`),
    "utf-8",
  );
  return new Response(raw, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
