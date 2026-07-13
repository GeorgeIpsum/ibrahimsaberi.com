import alacrittyImage from "@public/img/pages/tots/alacritty.svg";
import iterm2Image from "@public/img/pages/tots/iterm2.png";
import omzImage from "@public/img/pages/tots/omz.png";
import { Shell } from "lucide-react";
import type { ToolGroup } from "../types";

export const termTools = {
  name: "terminals, shells, etc.",
  icon: <Shell />,
  size: "medium",
  tools: [
    {
      name: "iterm2",
      image: iterm2Image,
      link: "https://iterm2.com/",
      description: "daily driver. the maintainers may or may not hate me.",
    },
    {
      name: "omz",
      image: omzImage,
      link: "https://ohmyz.sh/",
      description: "zsh customization framework.",
    },
    {
      name: "p10k",
      link: "https://github.com/romkatv/powerlevel10k",
      description:
        "omz theme. faster than starship, but no longer maintained. the price of being feature complete, i guess.",
    },
    {
      name: "alacritty",
      image: alacrittyImage,
      link: "https://alacritty.org/",
      description: "used on nixos.",
    },
  ],
} satisfies ToolGroup;
