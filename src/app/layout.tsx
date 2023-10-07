import Header from "@/components/structure/Header";
import "./globals.css";
import type { Metadata } from "next";

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
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
