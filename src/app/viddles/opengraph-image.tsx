import { kiwi } from "@lucide/lab";
import { createOgImage, size } from "@/features/og/create-og-image";

export const alt = "viddles";
export { size };

export const contentType = "image/png";

export default async function OpenGraphImage() {
  return createOgImage({
    title: alt,
    icon: kiwi,
  });
}
