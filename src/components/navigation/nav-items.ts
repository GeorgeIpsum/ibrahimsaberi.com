export interface NavItem {
  title: string;
  href: `/${string}`;
  mobileOnly?: boolean;
}

export const navItems = [
  { title: "hearth", href: "/", mobileOnly: true },
  { title: "basin", href: "/basin" },
  { title: "droplets", href: "/basin/droplets", mobileOnly: true },
  { title: "reservoir", href: "/reservoir", mobileOnly: true },
  { title: "spin", href: "/mrcl" },
  { title: "fm", href: "/fm" },
  { title: "about", href: "/about", mobileOnly: true },
  { title: "contact", href: "/contact", mobileOnly: true },
] as const satisfies readonly NavItem[];
