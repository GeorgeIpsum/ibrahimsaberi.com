import {
  // legibility is for babies
  // Atkinson_Hyperlegible_Mono,
  // looks a little too baby
  // Atkinson_Hyperlegible_Next,
  // overused
  // DM_Sans,
  Figtree,
  // LIGATURES RULE
  Fira_Code,
  Platypi,
  // maybe idk
  // Rubik,
} from "next/font/google";

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
