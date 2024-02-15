interface SiteLink {
  href: string;
  display: string;
  title?: string;
  emoji?: string;
}

export const headerLinks: SiteLink[] = [
  {
    href: "/basin",
    display: "Basin",
    title: "a cloudy surface",
    emoji: "🥣",
  },
  {
    href: "/projects",
    display: "Projects",
    title: "knick knacks really",
    emoji: "🌙",
  },
  {
    href: "/cha",
    display: "Chai",
    title: ":3",
    emoji: "🍵",
  },
];

export const settingsLinks: SiteLink[] = [
  // {
  //   href: "/crash",
  //   display: "craSH",
  //   title: "wip",
  //   emoji: "👾",
  // },
];
