import {
  Album,
  Cylinder,
  Droplets,
  Earth,
  type LucideIcon,
  MessageCircleHeart,
  MirrorRectangular,
  PersonStanding,
  Pin,
  Radio,
  Shell,
  ToolCase,
  TvMinimalPlay,
  WavesHorizontal,
} from "lucide-react";
export interface NavItem {
  title: string;
  href: `/${string}`;
  icon: LucideIcon;
  mobileOnly?: true;
  footerItem?: true;
  private?: true;
  underConstruction?: true;
}

export const navItems = [
  { title: "hearth", href: "/", icon: Earth, mobileOnly: true },
  {
    title: "about",
    href: "/about",
    icon: PersonStanding,
  },
  {
    title: "now",
    href: "/now",
    icon: Pin,
    footerItem: true,
  },
  { title: "basin", href: "/basin", icon: WavesHorizontal },
  { title: "reservoir", href: "/reservoir", icon: Cylinder, mobileOnly: true },
  { title: "spool", href: "/spool", icon: Album, footerItem: true },
  { title: "fm", href: "/fm", icon: Radio },
  {
    title: "contact",
    href: "/contact",
    icon: MessageCircleHeart,
    footerItem: true,
  },
  {
    title: "tots",
    href: "/tots",
    icon: ToolCase,
    mobileOnly: true,
  },
  {
    title: "reflection",
    href: "/reflection",
    icon: MirrorRectangular,
    mobileOnly: true,
  },
  {
    title: "sandbox",
    href: "/wash",
    icon: Shell,
    mobileOnly: true,
    underConstruction: true,
  },
  {
    title: "viddles",
    href: "/viddles",
    icon: TvMinimalPlay,
    mobileOnly: true,
    underConstruction: true,
  },
  {
    title: "droplets",
    href: "/basin/droplets",
    icon: Droplets,
    mobileOnly: true,
    private: true,
  },
] as const satisfies readonly NavItem[];
