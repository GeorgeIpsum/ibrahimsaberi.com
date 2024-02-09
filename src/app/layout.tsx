import type { Metadata } from "next";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import Script from "next/script";

import { cookie } from "@/_server/utils";
import Crash from "@/components/singletons/cli/Crash";
import { Gradient } from "@/components/singletons/gradient";
import { ThemeProvider } from "@/features/theme/ThemeProvider";

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
  const themeCookie = cookie(cookies).theme.get();
  const defaultTheme = headers().get("Sec-CH-Prefers-Color-Scheme");

  return (
    <html lang="en" data-mode={themeCookie ?? defaultTheme ?? "dark"}>
      <body>
        <ThemeProvider defaultTheme={themeCookie ?? (defaultTheme as Theme)}>
          <Gradient id="root-gradient" className="-z-20" />
          <div className="absolute bottom-0 left-0 right-0 top-0 -z-10 backdrop-blur-md" />
          <div className="flex w-full flex-row">
            <div className="w-full pb-12 sm:pb-8 md:pb-4">{children}</div>
            <Crash />
          </div>
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
