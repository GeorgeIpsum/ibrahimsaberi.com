import { Bot } from "lucide-react";
import type { ToolGroup } from "../types";

export const botTools = {
  name: "bots",
  icon: <Bot />,
  size: "large",
  tools: [
    {
      name: "claude",
      description: "",
    },
    {
      name: "ollama",
    },
    {
      name: "codex",
      description:
        "the annoying little brother. talks a lot but doesn't do much.",
    },
  ],
} satisfies ToolGroup;
