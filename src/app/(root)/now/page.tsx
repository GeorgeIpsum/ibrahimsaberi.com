import type { Metadata } from "next";
import { PageTitle } from "@/components/structure/title";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";
import { LibreMap } from "./map";

const coords = [-77.09406090455401, 38.98419034316663] as [number, number];

export default async function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="/now">{"/now"}</PageTitle>

      {/* this will only work once tile hosting service is live :( */}
      {/* <LibreMap /> */}
    </div>
  );
}

export const metadata: Metadata = {
  title: "/now",
  description: "what i'm doing right now.",
  openGraph: generateOgMetadata("now", "/now"),
};
