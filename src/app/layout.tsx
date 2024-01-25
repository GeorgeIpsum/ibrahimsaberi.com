import { Gradient } from "@/components/gradient";
import Header from "@/components/structure/Header";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "a whisper",
  description: "a wave",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Gradient id="root-gradient" className="-z-20" />
        <div className="absolute bottom-0 left-0 right-0 top-0 -z-10 dark:bg-indigo-950/95" />
        {children}
      </body>
    </html>
  );
}
