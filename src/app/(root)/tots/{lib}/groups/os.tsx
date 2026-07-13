import iosImage from "@public/img/pages/tots/ios.svg";
import macosImage from "@public/img/pages/tots/macos.svg";
import nixosImage from "@public/img/pages/tots/nixos.svg";
import { Cpu } from "lucide-react";
import type { OS, ToolGroup } from "../types";
export const operatingSystemTools = {
  name: "operating systems",
  icon: <Cpu />,
  size: "large",
  tools: [
    {
      name: "macos",
      description: "daily driver.",
      image: macosImage,
    },
    {
      name: "nixos",
      description: "used on almost all servers (home or otherwise).",
      image: nixosImage,
    },
    {
      name: "ios",
      description: "blue texts.",
      image: iosImage,
    },
  ],
} satisfies ToolGroup<OS>;
