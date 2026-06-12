import type { Metadata } from "next";
import Script from "next/script";

import "@/css/globals.css";
import "@/css/prose.css";

import { AnchoredToastProvider, ToastProvider } from "@/components/atoms/toast";
import { fontBody, fontHeading, fontMono } from "@/css/font";
import { cn } from "@/css/lib";
import { ThemeProvider } from "@/theme/theme-provider";
import { ThemeScript } from "@/theme/theme-script";

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
  title: "a whisper",
  description: "a wave",
  authors: [
    { name: "Ibrahim Ali Saberi", url: "https://ibrahimsaberi.com/about" },
    { name: "G1N", url: "https://ibrahimsaberi.com/about" },
  ],
  archives: "https://ibrahimsaberi.com/basin",
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "A Whisper — RSS" }],
      "application/atom+xml": [{ url: "/atom.xml", title: "A Whisper — Atom" }],
      "application/feed+json": [
        { url: "/feed.json", title: "A Whisper — JSON Feed" },
      ],
    },
  },
};
