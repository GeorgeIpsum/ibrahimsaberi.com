import arcImage from "@public/img/pages/tots/arc.svg";
import charlesImage from "@public/img/pages/tots/charles.png";
import cyberduckImage from "@public/img/pages/tots/cyberduck.png";
import figjamImage from "@public/img/pages/tots/figjam.jpeg";
import hyprlandImage from "@public/img/pages/tots/hyprland.svg";
import iinaImage from "@public/img/pages/tots/iina.png";
import iphoneMirroringImage from "@public/img/pages/tots/iphone-mirroring.png";
import karabinerImage from "@public/img/pages/tots/karabiner.png";
import linearImage from "@public/img/pages/tots/linear.png";
import mpvImage from "@public/img/pages/tots/mpv.png";
import nookImage from "@public/img/pages/tots/nook.png";
import obsImage from "@public/img/pages/tots/obs.svg";
import oraImage from "@public/img/pages/tots/ora.png";
import orbstackImage from "@public/img/pages/tots/orbstack.png";
import raycastImage from "@public/img/pages/tots/raycast.png";
import shiftImage from "@public/img/pages/tots/shift.png";
import transmissionImage from "@public/img/pages/tots/transmission.png";
import yaakImage from "@public/img/pages/tots/yaak.png";
import zenImage from "@public/img/pages/tots/zen.svg";
import { MessageCircleHeart } from "lucide-react";
import type { ToolGroup } from "../types";

export const supportingTools = {
  name: "supporting cast",
  icon: <MessageCircleHeart />,
  size: "small",
  tools: [
    {
      name: "zen browser",
      image: zenImage,
      platform: "nixos",
      description:
        "if there wasnt already a flake for this id honestly just use firefox.",
    },
    {
      name: "arc",
      image: arcImage,
      description:
        "it does the job fairly well, but i don't really want to continue supporting $company in any capacity (not to mention the random/ HUGE security issues that have popped up in the past). at least it's not (entirely) chrome.",
      lookingForReplacement: true,
      platform: "macos",
      evaluating: [
        {
          name: "nook",
          image: nookImage,
          description:
            "still kind of early, but promising. why are there so many arc clones.",
        },
        {
          name: "ora",
          image: oraImage,
          description: "too alpha, and unfortunately webkit based",
        },
        {
          name: "zen",
          image: zenImage,
          description:
            "please firefox/gecko i'm begging you to stop sucking on macos",
        },
        {
          name: "shift",
          image: shiftImage,
          description:
            'interesting but is by far the most "product"-ey (derogatory) out of all of these.',
        },
      ],
    },
    {
      name: "raycast",
      platform: "macos",
      image: raycastImage,
    },
    {
      name: "orbstack",
      platform: "macos",
      image: orbstackImage,
    },
    {
      name: "linear",
      underTheFold: true,
      image: linearImage,
    },
    {
      name: "figjam",
      underTheFold: true,
      image: figjamImage,
    },
    {
      name: "cyberduck",
      platform: "macos",
      underTheFold: true,
      image: cyberduckImage,
    },
    {
      name: "iina",
      platform: "macos",
      image: iinaImage,
      alternatives: [
        {
          name: "mpv",
          platform: "nixos",
          image: mpvImage,
        },
      ],
      underTheFold: true,
    },
    {
      name: "karabiner",
      platform: "macos",
      image: karabinerImage,
    },
    {
      name: "hyprland",
      platform: "nixos",
      image: hyprlandImage,
    },
    {
      name: "yaak",
      underTheFold: true,
      image: yaakImage,
    },
    {
      name: "charles",
      platform: "macos",
      image: charlesImage,
    },
    {
      name: "obs",
      underTheFold: true,
      image: obsImage,
    },
    {
      name: "iPhone Mirroring",
      platform: "macos",
      description:
        "for mobile app demos when mobile screen share in [$CRAP](/bad-software/teams) is buggy and or broken (its ALWAYS broken).",
      underTheFold: true,
      image: iphoneMirroringImage,
    },
    {
      name: "transmission",
      underTheFold: true,
      image: transmissionImage,
    },
  ],
} satisfies ToolGroup;
