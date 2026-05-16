import { Epilogue, Platypi } from "next/font/google";

export const fontBody = Epilogue({
	weight: "variable",
	subsets: ["latin"],
	variable: "--font-sans",
});

export const fontHeading = Platypi({
	weight: "variable",
	subsets: ["latin"],
	variable: "--font-heading",
});
