import type { Metadata } from "next";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";

export default async function Page() {
  return null;
}

export const metadata: Metadata = {
  title: "/now",
  description: "what i'm doing right now.",
  openGraph: generateOgMetadata("now", "/now"),
};
