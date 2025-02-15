import { Drop } from "@/components/drops";
import { api } from "@/trpc/server";

export default async function Page({ params }: { params: { slug: string } }) {
  const drop = await api.drops.bySlug.query(params.slug);
  if (!drop || !drop.content) {
    return null;
  }
  return <Drop {...drop} />;
}
