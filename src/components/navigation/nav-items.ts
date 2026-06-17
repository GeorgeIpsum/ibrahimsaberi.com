import {
  Album,
  Cylinder,
  Droplets,
  Earth,
  type LucideIcon,
  MessageCircleHeart,
  PersonStanding,
  Radio,
  WavesHorizontal,
} from "lucide-react";
export interface NavItem {
  title: string;
  href: `/${string}`;
  icon: LucideIcon;
  mobileOnly?: true;
  footerItem?: true;
  private?: true;
}

export const navItems = [
  { title: "hearth", href: "/", icon: Earth, mobileOnly: true },
  {
    title: "about",
    href: "/about",
    icon: PersonStanding,
  },
  { title: "basin", href: "/basin", icon: WavesHorizontal },
  { title: "reservoir", href: "/reservoir", icon: Cylinder, mobileOnly: true },
  { title: "spin", href: "/mrcl", icon: Album, footerItem: true },
  { title: "fm", href: "/fm", icon: Radio },
  {
    title: "contact",
    href: "/contact",
    icon: MessageCircleHeart,
    mobileOnly: true,
    footerItem: true,
  },
  {
    title: "droplets",
    href: "/basin/droplets",
    icon: Droplets,
    mobileOnly: true,
    private: true,
  },
] as const satisfies readonly NavItem[];
