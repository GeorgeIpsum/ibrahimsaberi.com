import type { Metadata } from "next";
import { Xterm } from "./xterm";
import "@xterm/xterm/css/xterm.css";

export const metadata: Metadata = {
  title: "waSH",
  description: "bash in the browser.",
  openGraph: {
    images: [{ url: "/og/wash.png", width: 1200, height: 630, alt: ">:_" }],
  },
};

export default function Page() {
  return (
    <div className="flex items-center justify-center rounded-lg border border-border bg-black p-4 shadow-black/20 shadow-xl">
      <Xterm />
    </div>
  );
}
