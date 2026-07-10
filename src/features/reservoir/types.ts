import type { LucideIcon } from "lucide-react";

export interface SiteProject {
  name: string;
  description: string;
  url: `/${string}` | `https://${string}` | `#${string}`;
  imageHref: `/${string}`;
  imageAlt?: string;
  imageTitle?: string;
  roots: string[];
  Icon: LucideIcon;
  notes: string[];
}
