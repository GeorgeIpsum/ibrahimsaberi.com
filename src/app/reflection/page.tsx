import type { Metadata, Viewport } from "next";
import { LightRays, NoiseTexture } from "@/components/backgrounds";
import { Reflect_ } from "../../services/reflection/components/reflect";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  return (
    <article className="flex h-dvh w-screen items-center justify-center bg-black">
      <LightRays className="isolate" color="rgba(70, 25, 1, 0.67)" />
      <div className="absolute inset-0 animate-pulse shadow-amber-100 [box-shadow:inset_0_0_30px_1px_var(--color-amber-950)]">
        <NoiseTexture frequency={0.7} noiseOpacity={0.2} />
      </div>
      <div className="isolate">
        <Reflect_ searchParams={searchParams} />
      </div>
    </article>
  );
}

export const metadata: Metadata = {
  title: "whois I",
  description:
    "look inward. wait why are you rolling your eyes upward. that's bad for you",
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
