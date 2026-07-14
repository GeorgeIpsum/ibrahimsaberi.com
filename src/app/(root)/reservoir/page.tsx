import type { Metadata } from "next";
import { Reservoir, SiteProjects } from "@/features/reservoir";

export default function Page() {
  return <Reservoir siteProjects={<SiteProjects />} />;
}

export const metadata: Metadata = {
  title: "reservoir",
  description: "stuff i've made.",
};
