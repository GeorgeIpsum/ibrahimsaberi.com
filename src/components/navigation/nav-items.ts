export interface NavItem {
  title: string;
  href: `/${string}`;
  mobileOnly?: true;
  private?: true;
}

export const navItems = [
  { title: "hearth", href: "/", mobileOnly: true },
  { title: "basin", href: "/basin" },
  { title: "reservoir", href: "/reservoir", mobileOnly: true },
  { title: "spin", href: "/mrcl" },
  { title: "fm", href: "/fm" },
  { title: "about", href: "/about", mobileOnly: true },
  { title: "contact", href: "/contact", mobileOnly: true },
  {
    title: "droplets",
    href: "/basin/droplets",
    mobileOnly: true,
    private: true,
  },
] as const satisfies readonly NavItem[];
