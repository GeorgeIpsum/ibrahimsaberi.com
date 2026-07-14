import type { Metadata } from "next";
import { UnderConstruction } from "@/components/navigation/under-construction";

export const metadata: Metadata = {
  title: "fm",
  description: "99.7 fm - the peach.",
  category: "reservoir",
  openGraph: {
    images: [
      {
        url: "/og/fm.png",
        width: 1200,
        height: 630,
        alt: "99.7 fm - the peach",
      },
    ],
  },
};

export default function Page() {
  return <UnderConstruction title="FM" />;
}
