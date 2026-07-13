import type { StaticImageData } from "next/image";

export interface SiteProject {
  name: string;
  description: string;
  url: `/${string}` | `https://${string}` | `#${string}`;
  image: StaticImageData;
  imageAlt?: string;
  imageTitle?: string;
  imagePosition?:
    | "object-top-left"
    | "object-top-right"
    | "object-bottom-left"
    | "object-bottom-right"
    | "object-center"
    | "object-top"
    | "object-bottom"
    | "object-left"
    | "object-right";
  roots: string[];
  deps?: string[];
  Icon: React.ReactNode;
  notes: string[];
}
