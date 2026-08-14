import miseImage from "@public/img/pages/tots/mise.svg";
import { Terminal } from "lucide-react";
import type { ToolGroup } from "../types";

export const cliTools = {
  name: "command line",
  description:
    "some tools that i use nearly daily, and others that i think deserve a shoutout.",
  icon: <Terminal />,
  size: "small",
  classNames: {
    name: "font-mono text-sm",
  },
  tools: [
    {
      name: "mise",
      image: { src: miseImage },
      link: "https://mise.jdx.dev/",
      description:
        "i got so tired of `nvm` blowing up my shell env that i had my entire team swap to this. it's actually incredible.",
    },
    {
      name: "bat",
      link: "https://github.com/sharkdp/bat",
      description:
        "imagine if `cat`s could fly. and could also highlight syntax.",
    },
    {
      name: "eza",
      link: "https://eza.rocks/",
      description: "`ls` but cooler. also confuses my team whenever i use it.",
    },
    {
      name: "ripgrep",
      link: "https://github.com/burntsushi/ripgrep",
      description: `1000 more years of "**rebuild it in rust**".`,
    },
    {
      name: "doggo",
      link: "https://doggo.mrkaran.dev/",
      description:
        "dns client (think `dig`). there's a go fetch joke here somewhere.",
    },
    {
      name: "doxx",
      link: "https://bgreenwell.github.io/doxx/doxx/",
      description:
        "i don't like having office products installed anywhere so i use this to read .docx files when i don't want to deal with Pages startup time.",
      underTheFold: true,
    },
    {
      name: "ffmpeg",
      link: "https://www.ffmpeg.org/",
      description:
        "people think xkcd.com/2347/ is about `bash` but it's actually about alternate universe `ffmpeg`. i'll explain later.",
      underTheFold: true,
    },
    {
      name: "yt-dlp",
      link: "https://github.com/yt-dlp/yt-dlp",
      description: "**VIVA LA RÉSISTANCE**",
      underTheFold: true,
    },
    {
      name: "catimg",
      link: "https://posva.net/shell/retro/bash/2013/05/27/catimg",
      description: "further proof that `imagemagick` is actual black magic.",
      underTheFold: true,
    },
    {
      name: "jq",
      link: "https://jqlang.org/",
      description: `"json is human-readable" ← absolutely deranged person`,
      underTheFold: true,
    },
    {
      name: "bearer",
      link: "https://docs.bearer.com/",
      description: "neat static analysis tool. good in short bursts.",
      underTheFold: true,
    },
    {
      name: "harfbuzz",
      link: "https://harfbuzz.github.io/",
      description:
        "text shaping engine. i don't really know what that means either.",
      underTheFold: true,
    },
    {
      name: "imagemagick",
      link: "https://imagemagick.org/#gsc.tab=0",
      description: "black magic.",
      underTheFold: true,
    },
    {
      name: "hurl",
      link: "https://hurl.dev/",
      description:
        "http request chainer, useful for testing. really nice for CI.",
      underTheFold: true,
    },
    {
      name: "lnav",
      link: "https://lnav.org/",
      description:
        "log soup viewer/ navigator. really useful for homelab/ home assistant debugging.",
      underTheFold: true,
    },
    {
      name: "sox",
      link: "https://github.com/chirlu/sox",
      description: "more black magic i'm pretty sure.",
      underTheFold: true,
    },
    {
      name: "tesseract",
      link: "https://tesseractocr.org/",
      description:
        "REMARKABLY good ocr considering the overall footprint. actually still amazes me how it can properly pick up the weirdest chicken scratch.",
      underTheFold: true,
    },
    {
      name: "sniffnet",
      link: "https://sniffnet.app/",
      description: "network traffic monitor.",
      underTheFold: true,
    },
    {
      name: "lonk",
      link: "https://github.com/GeorgeIpsum/lonk",
      description: "homegrown local link shortener utility. i made this :)",
      underTheFold: true,
    },
    {
      name: "litime",
      link: "https://github.com/ikornaselur/litime",
      description:
        "prints quotes that contain the current time. i invoke it on shell start. occasionally outputs a quote that could get me into trouble at work. buyer beware.",
    },
    {
      name: "zoxide",
      link: "https://github.com/ajeetdsouza/zoxide",
      description: "smarter, memory-enabled `cd`.",
    },
  ],
} satisfies ToolGroup;
