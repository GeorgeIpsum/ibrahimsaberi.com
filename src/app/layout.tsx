import type { Metadata } from "next";
import Script from "next/script";

import "@/css/globals.css";
import "@/css/prose.css";

import { AnchoredToastProvider, ToastProvider } from "@/components/atoms/toast";
import { fontBody, fontHeading, fontMono } from "@/css/font";
import { cn } from "@/css/lib";
import { ControlPanel } from "@/features/control-panel/control-panel";
import { ThemeProvider } from "@/features/theme";
import { ThemeScript } from "@/features/theme/theme-script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="system"
      data-contrast="system"
      suppressHydrationWarning
      className={cn(fontBody.variable, fontHeading.variable, fontMono.variable)}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="relative">
        <ToastProvider>
          <AnchoredToastProvider>
            <div className="relative isolate flex min-h-svh flex-col">
              <ThemeProvider defaultTheme="system" defaultContrast="system">
                {children}
              </ThemeProvider>
            </div>
          </AnchoredToastProvider>
        </ToastProvider>
        <ControlPanel />
      </body>
      {process.env.NODE_ENV === "production" &&
        process.env.VERCEL_ENV === "production" && (
          <Script
            defer
            src="https://us.umami.is/script.js"
            data-website-id="9aaf5328-5880-4788-8fe0-746467b2dd9a"
          />
        )}
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BASE_URL ?? "https://ibrahimsaberi.com"),
  title: "a whisper",
  description: "a wave",
  authors: [
    { name: "Ibrahim Ali Saberi", url: "https://ibrahimsaberi.com/about" },
    { name: "G1N", url: "https://github.com/GeorgeIpsum" },
  ],
  archives: "https://ibrahimsaberi.com/basin/archive",
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "ripples — RSS" }],
      "application/atom+xml": [{ url: "/atom.xml", title: "ripples — Atom" }],
      "application/feed+json": [{ url: "/feed.json", title: "ripples — JSON" }],
    },
  },
};
