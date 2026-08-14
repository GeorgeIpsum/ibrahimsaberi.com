import type { Metadata, Viewport } from "next";
import { ModifiableLightRays } from "@/components/backgrounds";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";
import { Reflect_ } from "@/features/reflection";
import { ReflectTheme } from "@/features/reflection/reflect-theme";

import "./theme.css";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  // TODO: make color fully user customizable via control panel ray color control
  return (
    <>
      <ReflectTheme />
      <article className="flex h-dvh w-screen items-center justify-center bg-black text-white">
        <ModifiableLightRays
          className="isolate"
          r={70}
          g={25}
          b={1}
          a={1}
          // color="rgba(70, 25, 1, 1)"
          // color="rgba(255, 168, 92, 1)"
        />
        <div
          className="absolute inset-0 animate-pulse [box-shadow:inset_0_0_30px_1px_var(--color-amber-500)]"
          style={
            {
              "--pulse-from-opacity": 0.2,
              "--pulse-to-opacity": 0.1,
              "--animation-duration": "6s",
            } as React.CSSProperties
          }
        >
          {/* <NoiseTexture frequency={0.7} noiseOpacity={0.2} /> */}
        </div>
        <div className="isolate">
          <Reflect_ searchParams={searchParams} />
        </div>
      </article>
    </>
  );
}

export const metadata: Metadata = {
  title: "WHOIS i",
  description:
    "look inward. wait no not literally with your eyes. stop rolling your eyes like that. that's bad for you",
  category: "reservoir",
  keywords: ["effigy", "pmd", "alignment", "personality quiz"],
  openGraph: generateOgMetadata("reflection", "WHOIS i"),
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#000000",
  userScalable: false,
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  width: "device-width",
  height: "device-height",
};
