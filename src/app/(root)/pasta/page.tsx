import type { Metadata } from "next";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";
import { PastaPlate } from "@/features/pasta/components/plate";

export const metadata: Metadata = {
  title: "pasta",
  description: "some fresh, some stale.",
  openGraph: generateOgMetadata("pasta", "some fresh, some stale."),
};

export default function Page() {
  return <PastaPlate />;
}
