import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";

import { getSystemThemeRSC } from "@/theme/get-system-theme.server";
import { ThemeProvider } from "@/theme/theme-provider";

export const metadata: Metadata = {
	title: "a whisper",
	description: "a wave",
	authors: [
		{ name: "Ibrahim Ali Saberi", url: "https://ibrahimsaberi.com/about" },
	],
	archives: "https://ibrahimsaberi.com/basin",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const theme = await getSystemThemeRSC();

	return (
		<html lang="en" data-theme={theme}>
			<body>
				<ThemeProvider defaultTheme={theme}>{children}</ThemeProvider>
			</body>
			{process.env.NODE_ENV === "production" && (
				<Script
					defer
					src="https://us.umami.is/script.js"
					data-website-id="9aaf5328-5880-4788-8fe0-746467b2dd9a"
				/>
			)}
			<Script id="global-site" src="/script.js" />
		</html>
	);
}
