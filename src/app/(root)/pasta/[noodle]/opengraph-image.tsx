// this is so jank
import { ligatureSquare } from "@lucide/lab";
import { createOgImage, size } from "@/features/og/create-og-image";

export const alt = "pasta";

export { size };

export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ noodle: string }>;
}) {
  const { noodle } = await params;
  return createOgImage({
    title: noodle.replace(/[-_]/g, " "),
    subtitle: "fresh out the pot",
    icon: ligatureSquare,
  });
}
