// Mirrors src/css/font.ts. The next/font transform in @storybook/nextjs-vite
// only resolves font declarations that live inside this package, so we
// re-declare them here rather than importing the app's font module through the
// `@` alias (which 404s the generated virtual module). Keep in sync with the app.
import { Figtree, Fira_Code, Platypi } from "next/font/google";

export const fontBody = Figtree({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-sans",
  adjustFontFallback: false,
});

export const fontHeading = Platypi({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-heading",
});

export const fontMono = Fira_Code({
  weight: "variable",
  subsets: ["latin", "symbols2"],
  variable: "--font-mono",
  adjustFontFallback: false,
});
