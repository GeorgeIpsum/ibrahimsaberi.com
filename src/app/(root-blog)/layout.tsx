import type { Metadata } from "next";

import { Footer, Header } from "@/components/structure";

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
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
