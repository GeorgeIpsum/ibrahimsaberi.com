import type { Metadata } from "next";
import { UnderConstruction } from "@/components/navigation/under-construction";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";

export const metadata: Metadata = {
  title: "fm",
  description: "99.7 fm - the peach.",
  category: "reservoir",
  openGraph: generateOgMetadata("fm", "99.7 fm - the peach."),
};

export default function Page() {
  return <UnderConstruction title="FM" />;
}
