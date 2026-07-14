import type { Metadata } from "next";
import { UnderConstruction } from "@/components/navigation/under-construction";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";
export const metadata: Metadata = {
  title: "now playing",
  description: "what i'm listening to right now.",
  category: "reservoir",
  openGraph: generateOgMetadata("now-playing", "now playing."),
};

export default function Page() {
  return <UnderConstruction title="Now Playing" />;
}
