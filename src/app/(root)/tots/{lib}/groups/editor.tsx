import neovimImage from "@public/img/pages/tots/neovim.svg";
import vscodeImage from "@public/img/pages/tots/vscode.svg";
import zedImage from "@public/img/pages/tots/zed.png";
import { FilePen } from "lucide-react";
import type { ToolGroup } from "../types";

export const textEditorTools = {
  name: "text editors",
  icon: <FilePen />,
  size: "large",
  tools: [
    {
      name: "zed",
      image: zedImage,
      link: "https://zed.dev/",
      description:
        "swapped from vscode because the amount of time i was spending editing .vscode/settings.json for performance tuning on a literal m4 pro chip was something out of a nightmare.",
    },
    {
      name: "vscode",
      image: vscodeImage,
      description:
        "for whenever i need to use liveshare to teach a junior or pair program with a team member.",
    },
    {
      name: "neovim",
      image: neovimImage,
      link: "https://neovim.io/",
      description: "nixos editor of choice. lean. mean. clean. green.",
    },
    {
      name: "vi",
      description: `picture this: you ssh into a server, run vi, make a bunch of edits, realize you don't actually have edit permissions because for whatever reason you're blind to the "read-only" warning, and then you repeat the entire thing with sudo vi.`,
    },
  ],
} satisfies ToolGroup;
