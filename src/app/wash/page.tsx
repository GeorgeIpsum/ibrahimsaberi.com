import type { Metadata } from "next";
import { Xterm } from "./xterm";

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: "/og/wash.png", width: 1200, height: 630, alt: ">:_" }],
  },
};

export default function Page() {
  return <Xterm />;
}
