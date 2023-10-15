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
        <div className="body-bg fixed -left-12 -top-12 -z-10 h-[calc(100vh+6rem)] w-[calc(100%+6rem)]"></div>
        {children}
      </body>
    </html>
  );
}
