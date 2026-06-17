import type { Metadata, Viewport } from "next";

export default function Page() {
  return (
    <article className="h-screen w-screen animate-pulse bg-black shadow-amber-100 [box-shadow:inset_0_0_30px_1px_var(--color-amber-950)]"></article>
  );
}

export const metadata: Metadata = {};

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
