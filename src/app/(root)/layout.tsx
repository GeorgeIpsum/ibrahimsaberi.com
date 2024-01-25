import Crash from "@/components/cli/Crash";
import Header from "@/components/structure/Header";
import type { Metadata } from "next";

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
      <Crash />
    </>
  );
}
