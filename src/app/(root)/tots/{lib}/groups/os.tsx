import iosImage from "@public/img/pages/tots/ios.svg";
import macosImage from "@public/img/pages/tots/macos.svg";
import nixosImage from "@public/img/pages/tots/nixos.svg";
import { Cpu } from "lucide-react";
import type { OS, ToolGroup } from "../types";
export const operatingSystemTools = {
  name: "operating systems",
  description: "gravy for the soul.",
  icon: <Cpu />,
  size: "large",
  tools: [
    {
      name: "macos",
      description:
        "daily driver. starting to get *really* tired of all the anti-features that are piling up in what was once a really nice os.",
      image: {
        src: macosImage,
        size: 36,
        className: "bg-white rounded-full border border-border",
      },
    },
    {
      name: "nixos",
      description:
        "used on almost all servers (home or otherwise). i'm not very smart so it took me forever to get used to this, but now i really cannot go back. send me cool flakes please.",
      image: {
        src: nixosImage,
        size: 26,
        containerClassName: "p-1 bg-white rounded-full border border-border",
        className: "bg-white rounded-full",
      },
    },
    {
      name: "ios",
      description: "blue texts. battery problems. **battlestar galactica.**",
      image: {
        src: iosImage,
        size: undefined,
        containerClassName: "bg-transparent rounded-none",
        className:
          "bg-transparent rounded-none dark:invert aspect-auto h-auto w-6",
      },
    },
  ],
} satisfies ToolGroup<OS>;
