import type { Metadata } from "next";
import { Xterm } from "./xterm";
import "@xterm/xterm/css/xterm.css";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";

export const metadata: Metadata = {
  title: "waSH",
  description: "bash in the browser.",
  openGraph: generateOgMetadata("wash", ">:_"),
};

export default function Page() {
  return (
    <div className="flex items-center justify-center rounded-lg border border-border bg-black p-4 shadow-black/20 shadow-xl">
      <Xterm />
    </div>
  );
}
