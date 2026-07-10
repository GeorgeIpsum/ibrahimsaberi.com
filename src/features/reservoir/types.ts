import type { LucideIcon } from "lucide-react";
import type { StaticImageData } from "next/image";

export interface SiteProject {
  name: string;
  description: string;
  url: `/${string}` | `https://${string}` | `#${string}`;
  image: StaticImageData;
  imageAlt?: string;
  imageTitle?: string;
  roots: string[];
  Icon: LucideIcon;
  notes: string[];
}
