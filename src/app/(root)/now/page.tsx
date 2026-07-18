import { Link2 } from "lucide-react";
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

      <div className="flex flex-col gap-2">
        <h2 className="text-lg text-muted-foreground lowercase">Building...</h2>
        <ul className="list-outside list-disc pl-4">
          <li>
            <h3 className="font-sans">this website</h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">
              <Link
                href="https://github.com/GeorgeIpsum/waSH"
                className="flex items-end gap-1"
              >
                waSH
                <Link2 className="mb-1 size-3" />
              </Link>
            </h3>
            <p className="text-muted-foreground text-sm"></p>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg text-muted-foreground lowercase">
          Listening...
        </h2>
        <ul className="list-outside list-disc pl-4">
          <li>
            <h3 className="h-6 font-sans">Loathe</h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">Philosophie du Soi • PAON</h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">Animadrop</h3>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg text-muted-foreground lowercase">Reading...</h2>
        <ul className="list-outside list-disc pl-4">
          <li>
            <h3 className="h-6 font-sans">
              The Three Body Problem{" "}
              <span className="text-muted-foreground">(again)</span>
            </h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">
              The Fifth Season{" "}
              <span className="text-muted-foreground">NK Jemison</span>
            </h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">
              Persepolis{" "}
              <span className="text-muted-foreground">Marjane Satrapi</span>
            </h3>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg text-muted-foreground lowercase">Playing...</h2>
        <ul className="list-outside list-disc pl-4">
          <li>
            <h3 className="h-6 font-sans">Hollow Knight: Silksong</h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">
              Final Fantasy Tactics: The Ivalice Chronicles
            </h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">
              Final Fantasy Tactics: The Ivalice Chronicles
            </h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">Unicord Overlord</h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">Spiritfall</h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">Hades 2</h3>
          </li>
          <li>
            <h3 className="h-6 font-sans">Metroid Prime 4</h3>
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg text-muted-foreground lowercase">
          Professionally...
        </h2>
        <ul className="list-outside list-disc pl-4">
          <li>
            <hgroup>
              <h3>
                Head of Product
                <span className="text-muted-foreground/50">
                  , formerly Product Owner
                </span>
              </h3>
              <p className="text-primary/50 text-sm">
                tilli Software •{" "}
                <Link href="/now/2023" className="underline">
                  2023
                </Link>{" "}
                — NOW
              </p>
            </hgroup>
            <ul className="list-outside list-disc pl-4 text-sm">
              <li>Building internal DX tooling</li>
              <li>Building v3 of tilli fluX</li>
              <li>Launching tilliX</li>
              <li>
                Launching IntraState: tilli's internal superadmin platform
              </li>
              <li>Centralizing auth for all tilli products</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "/now",
  description: "what i'm doing right now.",
  openGraph: generateOgMetadata("now", "/now"),
};
