import alacrittyImage from "@public/img/pages/tots/alacritty.svg";
import iterm2Image from "@public/img/pages/tots/iterm2.png";
import omzImage from "@public/img/pages/tots/omz.png";
import { Shell } from "lucide-react";
import type { ToolGroup } from "../types";

export const termTools = {
  name: "terminals, shells, etc.",
  description: "things i spend an inordinate amount of time configuring.",
  icon: <Shell />,
  size: "large",
  tools: [
    {
      name: "iterm2",
      platform: "macos",
      image: { src: iterm2Image },
      link: "https://iterm2.com/",
      description:
        "always open. i have been personally trying to fix a floating hotkey window bug for the past 3 years now. i should probably file a bug report at some point.",
    },
    {
      name: "alacritty",
      platform: "nixos",
      image: { src: alacrittyImage },
      link: "https://alacritty.org/",
      description:
        "fast and simple. makes running around my homelab k3s cluster a joy.",
    },
    {
      name: "omz",
      platform: "macos",
      image: { src: omzImage },
      link: "https://ohmyz.sh/",
      description: "zsh customization framework. oh me oh my.",
    },
    {
      name: "p10k",
      platform: "macos",
      link: "https://github.com/romkatv/powerlevel10k",
      description:
        "omz theme. used to use starship, but after running into weird perf bugs i came crawling back.",
    },
  ],
} satisfies ToolGroup;
