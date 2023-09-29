import Header from "@/components/structure/Header";
import "./globals.css";
import type { Metadata } from "next";
import { Kanit as BodyFont } from "next/font/google";

const bodyFont = BodyFont({ subsets: ["latin", "latin-ext"], weight: ["200", "400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "a whisper",
  description: "a wave",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.className}`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
