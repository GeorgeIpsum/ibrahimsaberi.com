import { wavesBirds } from "@lucide/lab";
import { createOgImage, size } from "@/features/og/create-og-image";

export const alt = "now playing";
export { size };

export const contentType = "image/png";

export default async function OpenGraphImage() {
  return createOgImage({
    title: alt,
    icon: wavesBirds,
  });
}
