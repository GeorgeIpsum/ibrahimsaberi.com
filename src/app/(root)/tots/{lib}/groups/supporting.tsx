import { MessageCircleHeart } from "lucide-react";
import type { ToolGroup } from "../types";

export const supportingTools = {
  name: "supporting cast",
  icon: <MessageCircleHeart />,
  size: "small",
  tools: [
    {
      name: "zen browser",
      platform: "nixos",
      description:
        "if there wasnt already a flake for this id honestly just use firefox.",
    },
    {
      name: "arc",
      description:
        "it does the job fairly well, but i don't really want to continue supporting $company in any capacity (not to mention the random/ HUGE security issues that have popped up in the past). at least it's not (entirely) chrome.",
      lookingForReplacement: true,
      platform: "macos",
      evaluating: [
        {
          name: "nook",
          description:
            "still kind of early, but promising. why are there so many arc clones.",
        },
        {
          name: "ora",
          description: "too alpha, and unfortunately webkit based",
        },
        {
          name: "zen",
          description:
            "please firefox i'm begging you to stop sucking on macos",
        },
        {
          name: "shift",
          description:
            'interesting but is by far the most "product"-ey (derogatory) out of all of these.',
        },
      ],
    },
    {
      name: "raycast",
      platform: "macos",
    },
    {
      name: "orbstack",
      platform: "macos",
    },
    {
      name: "linear",
      underTheFold: true,
    },
    {
      name: "figjam",
      underTheFold: true,
    },
    {
      name: "cyberduck",
      platform: "macos",
      underTheFold: true,
    },
    {
      name: "iina",
      platform: "macos",
      alternatives: [
        {
          name: "mpv",
          platform: "nixos",
        },
      ],
      underTheFold: true,
    },
    {
      name: "karabiner",
      platform: "macos",
    },
    {
      name: "hyprland",
      platform: "nixos",
    },
    {
      name: "yaak",
      underTheFold: true,
    },
    {
      name: "charles",
      platform: "macos",
    },
    {
      name: "obs",
      underTheFold: true,
    },
    {
      name: "iPhone Mirroring",
      platform: "macos",
      description:
        "for mobile app demos when mobile screen share in [$CRAP](/bad-software/teams) is buggy and or broken (its ALWAYS broken).",
      underTheFold: true,
    },
    {
      name: "transmission",
      underTheFold: true,
    },
  ],
} satisfies ToolGroup;
