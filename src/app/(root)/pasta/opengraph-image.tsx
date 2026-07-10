// this is so jank
import { ligatureSquare } from "@lucide/lab";
import { createOgImage, size } from "@/features/og/create-og-image";

export const alt = "pasta";

export { size };

export const contentType = "image/png";

export default async function OpenGraphImage() {
  return createOgImage({
    title: alt,
    subtitle: "some fresh, some stale",
    icon: ligatureSquare,
  });
}
