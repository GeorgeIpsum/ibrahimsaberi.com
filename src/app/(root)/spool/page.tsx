import { UnderConstruction } from "@/components/navigation/under-construction";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";

export default function Page() {
  return <UnderConstruction title="MRCL" />;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "spool",
  description: "a link/ image/ blog reel.",
  openGraph: generateOgMetadata("spool", "a content reel"),
};
