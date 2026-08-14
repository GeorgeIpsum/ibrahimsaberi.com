import { Bot } from "lucide-react";
import type { ToolGroup } from "../types";

export const botTools = {
  name: "bots",
  description: "little guys in my computer. don't anthro them please.",
  icon: <Bot />,
  size: "large",
  tools: [
    {
      name: "claude",
      description:
        "i asked for peers at my job and this is what they gave me. better than nothing i guess. actually might literally be worse than nothing. ask me again in a year.",
    },
    {
      name: "ollama",
      description:
        "local inferencing and workloads, though i stick with <30b models for now. one day hope to run a 120b model on my homelab.",
    },
    {
      name: "codex",
      description:
        "the annoying [little brother](https://github.com/GeorgeIpsum/lil-bro). talks a lot of smack (used almost exclusively for pr review) but doesn't do much.",
    },
  ],
} satisfies ToolGroup;
