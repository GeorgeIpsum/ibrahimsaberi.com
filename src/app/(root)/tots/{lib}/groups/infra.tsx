import { Cuboid } from "lucide-react";
import type { ToolGroup } from "../types";

export const infraTools = {
  name: "infra",
  icon: <Cuboid />,
  size: "medium",
  tools: [
    {
      name: "macbook pro",
      platform: "macos",
      description:
        "it runs claude (sometimes codex). i code on this too allegedly.",
    },
    {
      name: "mac mini",
      platform: ["macos", "nixos"],
      description:
        "used for proxying imessage and running local llm inference. also runs homebridge and home assistant.",
    },
    {
      name: "dota 2 bigrig",
      platform: "windows",
      description:
        "once upon a time, an overkill gaming pc. now, a very very overkill dota 2 machine. proton lovers be damned, dx12 (ime) reigns supreme. (I use the steam deck for literally everything else.)",
    },
    {
      name: "rbpi 5",
      platform: "nixos",
      description: "bridges home assistant with the rest of my homelab.",
    },
    // {
    //   name: "Zyxel GS1920-24HPv2",
    //   underTheFold: true,
    //   description:
    //     "currently unused (and overkill) network switch. i have another small one that i'm actually using but it sits in a really precarious position in a cabinet right now and i don't want to move it to find out what it is.",
    // },
    {
      name: "Synology NAS ds225+",
      underTheFold: true,
      description: "imo a little overrated but i illmatic is still a classic.",
    },
    {
      name: "NIORFNIO 15w fm transmitter",
      underTheFold: true,
      description:
        "i'm not sure this should be legal to own considering how powerful it is. drives my amateur radio setup.",
    },
    // {
    //   name: "Pyle P3201BT",
    //   underTheFold: true,
    //   description:
    //     "very overkill bt preamp receiver. let's me connect a lot of random audio sinks together.",
    // },
    // {
    //   name: "CyberPower CP1500PFCLCD",
    //   underTheFold: true,
    //   description: "UPS my beloved",
    // },
  ],
} satisfies ToolGroup;
