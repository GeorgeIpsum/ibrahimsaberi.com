import { readFile } from "node:fs/promises";
import path from "node:path";
import { sectionDir } from "@/features/basin/load-section";
import { listRipples, loadRippleMeta } from "@/features/basin/ripples";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await listRipples();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params;
  const meta = await loadRippleMeta(slug);
  if (!meta)
    return new Response("There is no post here. There was never a post here.", {
      status: 404,
    });
  const raw = await readFile(
    path.join(sectionDir("ripples"), `${meta.basename}.mdx`),
    "utf-8",
  );
  return new Response(raw, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
