import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";

import { cookie } from "@/_server/utils";
import Crash from "@/components/cli/Crash";
import { Gradient } from "@/components/gradient";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "a whisper",
  description: "a wave",
  authors: [{ name: "Ibrahim Ali Saberi" }],
  archives: "https://ibrahimsaberi.com/basin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeCookie = cookie().theme.get();
  const defaultTheme = headers().get("Sec-CH-Prefers-Color-Scheme");

  return (
    <html lang="en" data-mode={themeCookie ?? defaultTheme ?? "dark"}>
      <body className="flex h-full flex-col">
        <ThemeProvider defaultTheme={themeCookie ?? (defaultTheme as Theme)}>
          <Gradient id="root-gradient" className="-z-20" />
          <div className="absolute bottom-0 left-0 right-0 top-0 -z-10 backdrop-blur-md" />
          {children}
          <Crash />
        </ThemeProvider>
      </body>
      {process.env.NODE_ENV === "production" && (
        <Script
          defer
          src="https://us.umami.is/script.js"
          data-website-id="9aaf5328-5880-4788-8fe0-746467b2dd9a"
        />
      )}
      <Script id="global-site" src="/global.js" />
    </html>
  );
}
