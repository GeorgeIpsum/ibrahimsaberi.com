import type { Metadata } from "next";
import { UnderConstruction } from "@/components/navigation/under-construction";

export default async function Page() {
  return <UnderConstruction title="The Wall of Shame" />;
}

export const metadata: Metadata = {
  title: "a software wall of shame",
  description: "x deemed harmful.",
};
