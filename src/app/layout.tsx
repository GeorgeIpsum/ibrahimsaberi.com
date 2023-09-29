import "./globals.css";
import type { Metadata } from "next";
import { GFS_Didot as BodyFont } from "next/font/google";

const bodyFont = BodyFont({ subsets: ["greek"], weight: ["400"] });

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
      <body className={bodyFont.className}>{children}</body>
    </html>
  );
}
