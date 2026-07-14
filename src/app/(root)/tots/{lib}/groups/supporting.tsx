import arcImage from "@public/img/pages/tots/arc.svg";
import charlesImage from "@public/img/pages/tots/charles.png";
import cyberduckImage from "@public/img/pages/tots/cyberduck.png";
import figjamImage from "@public/img/pages/tots/figjam.jpeg";
import hyprlandImage from "@public/img/pages/tots/hyprland.svg";
import iinaImage from "@public/img/pages/tots/iina.png";
// import iphoneMirroringImage from "@public/img/pages/tots/iphone-mirroring.png";
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
  description: "last, but definitely not least.",
  icon: <MessageCircleHeart />,
  size: "small",
  tools: [
    {
      name: "zen browser",
      image: { src: zenImage },
      platform: ["windows", "nixos"],
      description:
        "if there wasnt already a flake for this id honestly just use firefox.",
    },
    {
      name: "arc",
      image: { src: arcImage },
      description:
        "currently evaluating alternatives. dead app and shady-ish untrustworthy company behind it. at least it's not (entirely) chrome.",
      lookingForReplacement: true,
      platform: "macos",
      evaluating: [
        {
          name: "nook",
          image: { src: nookImage },
          description:
            "still kind of early, but promising. why are there so many arc clones.",
        },
        {
          name: "ora",
          image: { src: oraImage },
          description: "too alpha, and unfortunately webkit based",
        },
        {
          name: "zen",
          image: { src: zenImage },
          description:
            "please firefox/gecko i'm begging you to stop sucking on macos",
        },
        {
          name: "shift",
          image: { src: shiftImage },
          description:
            'interesting but is by far the most "product"-ey (derogatory) out of all of these.',
        },
      ],
    },
    {
      name: "raycast",
      platform: "macos",
      link: "https://www.raycast.com/",
      image: { src: raycastImage, className: "rounded" },
      description: "game. changed.",
    },
    {
      name: "orbstack",
      platform: "macos",
      link: "https://orbstack.dev/",
      image: { src: orbstackImage, className: "rounded" },
      description:
        "imagine if docker desktop didn't make you want to burn your computer.",
    },
    {
      name: "linear",
      underTheFold: true,
      image: { src: linearImage, className: "rounded" },
      description:
        "imagine if jira didn't make you want to **burn down the entire building.**",
    },
    {
      name: "figjam",
      underTheFold: true,
      image: { src: figjamImage, className: "rounded" },
      description:
        "whiteboarding made easy (until it isn't). i'm honestly making a replacement at the moment.",
    },
    {
      name: "cyberduck",
      platform: ["macos", "nixos"],
      link: "https://cyberduck.io/",
      underTheFold: true,
      image: { src: cyberduckImage },
      description: `only software i'd ever describe as "babygirl"`,
    },
    {
      name: "iina",
      platform: "macos",
      link: "https://iina.io/",
      image: { src: iinaImage },
      description: "mpv but for macos (including the cli bits). big fan.",
      alternatives: [
        {
          name: "mpv",
          platform: ["windows", "nixos"],
          description: "the root of all good.",
          image: { src: mpvImage },
        },
      ],
      underTheFold: true,
    },
    {
      name: "karabiner",
      platform: "macos",
      link: "https://karabiner-elements.pqrs.org/",
      image: { src: karabinerImage },
      description: "once again i can use caps lock as an fn key. thank you.",
    },
    {
      name: "hyprland",
      platform: "nixos",
      link: "https://hypr.land/",
      image: { src: hyprlandImage },
      description: "only wayland wm i can use tbh.",
    },
    {
      name: "yaak",
      underTheFold: true,
      link: "https://yaak.app/",
      image: { src: yaakImage, className: "rounded" },
      description:
        "postman but foss. http request chaining requires changing the mental model a bit but once you get it, you get it.",
    },
    {
      name: "charles",
      platform: "macos",
      link: "https://www.charlesproxy.com/",
      image: { src: charlesImage },
      description: "buy this software. buy this software. buy this software.",
    },
    {
      name: "obs",
      underTheFold: true,
      link: "https://obsproject.com/",
      platform: ["windows", "macos"],
      image: { src: obsImage },
      description:
        "streaming, recording, compositing, and more. really useful.",
    },
    // {
    //   name: "iPhone Mirroring",
    //   platform: "macos",
    //   description:
    //     "for mobile app demos when mobile screen share in [$CRAP](/bad-software/teams) is buggy and or broken (its ALWAYS broken).",
    //   underTheFold: true,
    //   image: { src: iphoneMirroringImage },
    // },
    {
      name: "transmission",
      underTheFold: true,
      platform: "macos",
      image: { src: transmissionImage },
      description: "simple and effective torrent client. 🏴‍☠️",
    },
  ],
} satisfies ToolGroup;
