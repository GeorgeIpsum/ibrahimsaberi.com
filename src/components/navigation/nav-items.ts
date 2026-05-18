interface NavItem {
  title: string;
  href: `/${string}`;
  mobileOnly?: boolean;
}

export const navItems: NavItem[] = [
  { title: "home", href: "/", mobileOnly: true },
  { title: "about", href: "/about", mobileOnly: true },
  { title: "projects", href: "/projects", mobileOnly: true },
  { title: "basin", href: "/basin" },
  { title: "spin", href: "/mrcl" },
  { title: "fm", href: "/fm" },
  { title: "contact", href: "/contact", mobileOnly: true },
];
