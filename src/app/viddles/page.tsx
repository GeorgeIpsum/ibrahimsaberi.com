import type { Metadata } from "next";
import { UnderConstruction } from "@/components/navigation/under-construction";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";

export const metadata: Metadata = {
  title: "viddles",
  description: "video grabber",
  category: "reservoir",
  openGraph: generateOgMetadata("viddles"),
};

export default function Page() {
  return <UnderConstruction title="Viddles" />;
}
