import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import Crash from "@/components/cli/Crash";
import { Gradient } from "@/components/gradient";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { type Theme } from "@/utils-client/types";
import { THEME_COOKIE_NAME } from "@/utils/dom";
import "./globals.css";

export const metadata: Metadata = {
  title: "a whisper",
  description: "a wave",
};

const themeScript = `
document.documentElement.dataset.mode = (() => {
  const persistentTheme = window.localStorage.getItem("theme");
  if (persistentTheme === "dark" || persistentTheme === "light") {
    return persistentTheme;
  }
  const mqTheme = window.matchMedia("(prefers-color-scheme: dark)");
  return mqTheme.matches ? "dark" : "light";
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value as Theme;

  return (
    <html lang="en" data-mode={themeCookie ?? "dark"}>
      <Script id="set-initial-theme">{themeScript}</Script>
      <body className="flex h-full flex-col">
        <ThemeProvider defaultTheme={themeCookie}>
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
    </html>
  );
}
