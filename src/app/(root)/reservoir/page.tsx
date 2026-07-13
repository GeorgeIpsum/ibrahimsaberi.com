import { Reservoir } from "@/features/reservoir";
import { SiteProjects } from "@/features/reservoir/components/site";

export default function Page() {
  return <Reservoir siteProjects={<SiteProjects />} />;
}
