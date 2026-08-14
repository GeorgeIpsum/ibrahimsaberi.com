import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "a whisper",
    short_name: "a wave",
    description:
      "A basin sits alone atop the East bridge.        It overflows.      ",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f00",
    theme_color: "#0f0f00",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
