import type { Metadata, Viewport } from "next";
import { LightRays } from "@/components/backgrounds";
import { Reflect_ } from "@/features/reflection";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  return (
    <article className="flex h-dvh w-screen items-center justify-center bg-black">
      <LightRays className="isolate" color="rgba(70, 25, 1, 1)" />
      <div className="absolute inset-0 animate-pulse shadow-amber-50 [box-shadow:inset_0_0_30px_1px_var(--color-amber-950)]">
        {/* <NoiseTexture frequency={0.7} noiseOpacity={0.2} /> */}
      </div>
      <div className="isolate">
        <Reflect_ searchParams={searchParams} />
      </div>
    </article>
  );
}

export const metadata: Metadata = {
  title: "WHOIS i",
  description:
    "look inward. wait no not literally with your eyes. stop rolling your eyes like that. that's bad for you",
  category: "reservoir",
  keywords: ["effigy", "pmd", "alignment", "personality quiz"],
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
