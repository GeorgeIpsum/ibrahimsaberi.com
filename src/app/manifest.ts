import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A Whisper",
    short_name: "A Wave",
    description: "A basin sits alone atop the East bridge. It overflows.",
    start_url: "ibrahimsaberi.com",
    display: "standalone",
    background_color: "#0f0f00",
    theme_color: "#0f0f00",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
