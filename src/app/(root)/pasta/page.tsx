import type { Metadata } from "next";
import { PastaPlate } from "@/features/pasta/components/plate";

export const metadata: Metadata = {
  title: "pasta",
  description: "some fresh, some stale.",
  openGraph: {
    images: [
      {
        url: "/og/pasta.png",
        width: 1200,
        height: 630,
        alt: "pasta - some fresh, some stale",
      },
    ],
  },
};

export default function Page() {
  return <PastaPlate />;
}
