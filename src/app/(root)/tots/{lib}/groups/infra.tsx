import { Cuboid } from "lucide-react";
import type { ToolGroup } from "../types";

export const infraTools = {
  name: "infra",
  description: "physical hardware that i use daily.",
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
        "once upon a time, a gaming pc. now, a dota 2 machine. steam deck/switch 2 for literally everything else.",
    },
    {
      name: "rbpi 5",
      platform: "nixos",
      description: "bridges home assistant with the rest of my homelab.",
    },
    {
      name: "dearly ebloved",
      platform: "nixos",
      underTheFold: true,
      description:
        "a server i purchased from hetzner server auction. he is very far away but we love him very much. he says hello from helsinki.",
    },
    {
      name: "niorfnio 15w fm transmitter",
      underTheFold: true,
      description:
        "i'm not sure this should be legal to own considering how powerful it is. drives the radio part of my amateur radio setup.",
    },
    {
      name: "synology nas ds225+",
      underTheFold: true,
      description: "imo a little overrated but illmatic is a classic.",
    },
    {
      name: "zyxel gs1920-24hpv2",
      underTheFold: true,
      description:
        "currently unused (and overkill) network switch. i have another small one that i'm actually using but it sits in a really precarious position in a cabinet right now and i don't want to move it to find out what it is.",
    },
    {
      name: "pyle p3201Bt",
      underTheFold: true,
      description:
        "very overkill bt preamp receiver. let's me connect a lot of random audio sinks together.",
    },
    {
      name: "cyberpower cp1500pfclcd",
      underTheFold: true,
      description: "ups my beloved",
    },
  ],
} satisfies ToolGroup;
