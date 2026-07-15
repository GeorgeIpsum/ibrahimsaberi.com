import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/structure/title";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";
import { LibreMap } from "./map";

const coords = [-77.09406090455401, 38.98419034316663] as [number, number];

export default async function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle containerClassName="relative z-100" title="/now">
        {"/now"}
      </PageTitle>
      <div className="relative -mx-4 -mt-8 overflow-hidden rounded-b-lg">
        <LibreMap initialCoords={coords} />
        <div className="absolute inset-0 bg-linear-to-b from-background to-20% to-transparent" />
      </div>
      <ul className="list-disc">
        <li>
          <hgroup>
            <h2>
              Head of Product
              <span className="text-muted-foreground/50">
                , formerly Product Owner
              </span>
            </h2>
            <p className="text-primary/50 text-sm">
              tilli Software •{" "}
              <Link href="/now/2023" className="underline">
                2023
              </Link>{" "}
              — NOW
            </p>
          </hgroup>
        </li>
        <li>
          <hgroup></hgroup>
        </li>
      </ul>
    </div>
  );
}

export const metadata: Metadata = {
  title: "/now",
  description: "what i'm doing right now.",
  openGraph: generateOgMetadata("now", "/now"),
};
