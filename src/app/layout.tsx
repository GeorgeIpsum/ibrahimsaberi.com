import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";

import { HistoryProvider } from "@/components/navigation/history-provider";
import { fontBody, fontHeading, fontMono } from "@/css/font";
import { cn } from "@/css/lib";
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
		<html
			lang="en"
			data-theme={theme}
			className={cn(fontBody.variable, fontHeading.variable, fontMono.variable)}
		>
			<HistoryProvider>
				<body className="relative">
					<div className="relative isolate flex min-h-svh flex-col">
						<ThemeProvider defaultTheme={theme}>{children}</ThemeProvider>
					</div>
				</body>
			</HistoryProvider>
			{process.env.NODE_ENV === "production" && (
				<Script
					defer
					src="https://us.umami.is/script.js"
					data-website-id="9aaf5328-5880-4788-8fe0-746467b2dd9a"
				/>
			)}
		</html>
	);
}
