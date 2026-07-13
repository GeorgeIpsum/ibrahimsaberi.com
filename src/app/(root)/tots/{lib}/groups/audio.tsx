import { AudioLines } from "lucide-react";
import type { ToolGroup } from "../types";

export const audioTools = {
  name: "audio",
  description:
    "what i listen with mainly. mostly low-end/ budget stuff but i still love what i have. i don't make any music (yet).",
  icon: <AudioLines />,
  size: "small",
  classNames: {
    name: "text-xs",
  },
  tools: [
    {
      name: "beyerdynamic dt 990 pro (250 ohm)",
      description:
        "daily driver. made me finally deal with grounding issues in my apartment.",
    },
    {
      name: "sennheiser hd 660s2 (and 660 (and 6xx))",
      description:
        "used these for years until i got a little tired of the sound stage. still amazing.",
      underTheFold: true,
    },
    {
      name: "schiit magni+ modi+ stack",
      description: "one day i'll upgrade these. they work well.",
    },
    {
      name: "edifier r1700bts",
      description: "primary apartment speakers. a classic.",
    },
    {
      name: 'dayton sub-1000 10"',
      description:
        "paired with the eddies. it's a budget sub so it's not phenomenal, but i have to keep the gain pretty low anyway so my neighbors don't hate me.",
      underTheFold: true,
    },
    {
      name: "mackie mc-350",
      description:
        "pretttty nice but i literally cannot use these with my glasses on. sad.",
      underTheFold: true,
    },
    {
      name: "sennheiser hd 598",
      description:
        "where it all started. now used by my cousin, who i hope to get hooked on this stuff too.",
      underTheFold: true,
    },
    {
      name: "airpods pro 3",
      description:
        "a miserable little pile of secrets. i use these so i can let everyone at work know that i do not care about mic quality.",
      underTheFold: true,
    },
  ],
} satisfies ToolGroup;
