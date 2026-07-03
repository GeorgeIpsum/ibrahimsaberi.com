export type Theme =
  | "light"
  | "dark"
  | "system"
  | "system-light"
  | "system-dark";

export type ResolvedTheme = "light" | "dark";

export type Contrast =
  | "normal"
  | "high"
  | "system"
  | "system-normal"
  | "system-high";

export const colorTokens = [
  "primary",
  "background",
  "foregroundHighContrast",
  "foreground",
  "muted",
  "mutedForeground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "accent",
  "accentForeground",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebarForeground",
  "sidebarPrimary",
  "sidebarAccent",
  "sidebarBorder",
  "sidebarRing",
  "destructive",
  "destructiveForeground",
  "warning",
  "warningForeground",
  "success",
  "successForeground",
  "info",
  "infoForeground",
  "highlight",
  "sidewind",
  "waveShadowBelow",
  "waveShadowAbove",
] as const;
export type ColorToken = (typeof colorTokens)[number];

export type ColorTokens = Partial<Record<ColorToken, string>>;

export const tokenVarMap: Record<ColorToken, string> = colorTokens.reduce(
  (acc, token) => {
    // convert token (camelCase) to CSS variable name (kebab-case)
    const varName = `--${token.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;
    acc[token] = varName;
    return acc;
  },
  {} as Record<ColorToken, string>,
);
