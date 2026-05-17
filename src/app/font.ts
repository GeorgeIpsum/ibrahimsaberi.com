import {
	Atkinson_Hyperlegible_Mono,
	Atkinson_Hyperlegible_Next,
	Platypi,
} from "next/font/google";

export const fontBody = Atkinson_Hyperlegible_Next({
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

export const fontMono = Atkinson_Hyperlegible_Mono({
	weight: "variable",
	subsets: ["latin"],
	variable: "--font-mono",
	adjustFontFallback: false,
});
