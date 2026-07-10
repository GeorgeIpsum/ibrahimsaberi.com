import type { Metadata } from "next";
import { UnderConstruction } from "@/components/navigation/under-construction";

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: "/og/hsab.png", width: 1200, height: 630, alt: ">:_" }],
  },
};

export default function Page() {
  return <UnderConstruction title="Sandbox" />;
}
