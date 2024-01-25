import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "A Whisper",
    short_name: "A Wave",
    description: "A basin sits alone atop the bridge. It overflows.",
    start_url: "ibrahimsaberi.com",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
