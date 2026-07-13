import type { Metadata } from "next";
import { Xterm } from "./xterm";
import "@xterm/xterm/css/xterm.css";

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: "/og/wash.png", width: 1200, height: 630, alt: ">:_" }],
  },
};

export default function Page() {
  return <Xterm />;
}
