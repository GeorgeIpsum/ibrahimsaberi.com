import { Gradient } from "@/components/gradient";
import Header from "@/components/structure/Header";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import type { Metadata } from "next";
import Script from "next/script";

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
  return (
    <html lang="en">
      <Script id="set-theme">{themeScript}</Script>
      <body>
        <ThemeProvider>
          <Gradient id="root-gradient" className="-z-20" />
          <div className="absolute bottom-0 left-0 right-0 top-0 -z-10 bg-emerald-50/5 dark:bg-emerald-950/5" />
          {children}
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
