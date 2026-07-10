import { peach } from "@lucide/lab";
import { createOgImage, size } from "@/features/og/create-og-image";

export const alt = "99.7 fm - the peach";

export { size };

export const contentType = "image/png";

export default async function OpenGraphImage() {
  return createOgImage({
    title: "99.7 fm",
    subtitle: "the peach",
    icon: peach,
  });
}
