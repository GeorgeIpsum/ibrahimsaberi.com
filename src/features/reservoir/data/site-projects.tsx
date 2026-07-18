import controlPanelImage from "@public/img/pages/reservoir/control-panel.png";
import dota2VoicelinesImage from "@public/img/pages/reservoir/d2-voiceline.jpeg";
import fmImage from "@public/og/fm.png";
import homeImage from "@public/og/home.png";
// import hsabImage from "@public/og/hsab.png";
import nowPlayingImage from "@public/og/now-playing.png";
import pastaImage from "@public/og/pasta.png";
import reflectionImage from "@public/og/reflection.png";
import speedtestImage from "@public/og/speedtest.png";
import viddlesImage from "@public/og/viddles.png";

import {
  AudioLines,
  Copy,
  EthernetPort,
  Globe,
  Headphones,
  InspectionPanel,
  MirrorRectangular,
  Radio,
  // Shell,
  TvMinimalPlay,
} from "lucide-react";
import type { SiteProject } from "../types";

export const siteProjects: SiteProject[] = [
  {
    name: "ibrahimsaberi.com",
    url: "/",
    image: homeImage,
    // imagePosition: "object-left",
    description: "literally this website",
    Icon: <Globe className="size-4" />,
    roots: [""],
    deps: [
      "react",
      "nextjs",
      "tailwind",
      "@mdx-js",
      "wordgard",
      "rehype",
      "remark",
      "cva@beta",
      "base-ui",
      "coss ui",
    ],
    notes: [
      "built with nextjs 16 (cc + ppr), tailwind, mdx, coss ui/ base-ui.",
      "supporting cast of lucide-icons, a lot of rehype/ remark plugins (some homegrown), motion, three.js, cva, tsx, and a bunch of others.",
      "if (for whatever reason) you want to open a PR, a good place to start is grepping for `TODO` in the codebase. there are a handful.",
    ],
  },
  {
    name: "reflection",
    url: "/reflection",
    image: reflectionImage,
    description: "a personality quiz a la Pokémon Mystery Dungeon",
    Icon: <MirrorRectangular className="size-4" />,
    roots: ["src/app/reflection", "src/features/reflection"],
    deps: ["motion", "three.js", "chroma-js", "@lucide/lab"],
    notes: [
      "mostly a project to test my motion knowledge, including some random CSS hacks and control-panel goodies.",
      "hopefully one-day this will help soft-launch some of the stuff you might see in the /heroes path in this repo.",
    ],
  },
  {
    name: "speedtest",
    url: "/speedtest",
    image: speedtestImage,
    description: "a simple network speed test tool",
    Icon: <EthernetPort className="size-4" />,
    roots: [
      "src/app/speedtest",
      "src/features/speedtest",
      "src/hooks/use-network-quality.ts",
    ],
    deps: ["network-information-api"],
    notes: [
      "a (very naive) speedtest implementation using XHR and the Network Information API.",
      "probably not super accurate, and location detection relies entirely on Vercel's edge network/ their IP geolocation info, but it gets the job done.",
      "at least your ISP won't detect that this is a speedtest and start boosting your bandwidth.",
    ],
  },
  {
    name: "control panel",
    url: "/",
    image: controlPanelImage,
    imagePosition: "object-right",
    description: "a drop-in modal control panel",
    Icon: <InspectionPanel className="size-4" />,
    roots: ["src/features/control-panel"],
    deps: ["mobx"],
    notes: [
      "i found the leva library and wanted to build my own version using mobx internal observable state.",
      "it's grown into a pretty cool tool that i can use during dev/ realtime to tweak things on the fly.",
      "press ctrl+k to see this right now.",
    ],
  },
  {
    name: "dota2 voicelines",
    url: "/api/audio/voice-responses",
    image: dota2VoicelinesImage,
    imageTitle:
      "unceremoniously yoinked from https://www.youtube.com/watch?v=cNubRZduGDs",
    description: "a simple API endpoint for getting dota2 voice lines",
    Icon: <AudioLines className="size-4" />,
    roots: [
      "src/app/api/audio/voice-responses",
      ".scripts/dota2-voicelines",
      ".github/workflows/upload-assets-r2.yml",
    ],
    deps: ["r2", "node-html-parser"],
    notes: [
      "something I wanted to create so I don't have to constantly throw traffic at liquipedia for dota2 voicelines.",
      "accepted query params are `hero`, `voiceline` and `category`.",
    ],
  },
  {
    name: "yt-dlp-wasm",
    url: "/viddles",
    image: viddlesImage,
    description:
      "yt-dlp compiled to WebAssembly, usable on the web (with some additional but necessary cruft)",
    Icon: <TvMinimalPlay className="size-4" />,
    roots: [
      "src/app/viddles",
      "src/app/yt-dlp-test",
      "src/services/yt-dlp",
      "packages/yt-dlp-wasm",
      "services/wisp-server",
      ".github/workflows/deploy-wisp.yml",
    ],
    deps: ["yt-dlp", "ffmpeg", "pyodide", "wisp"],
    notes: [
      "i literally just wanted to see Fable 5 create something end-to-end. it did.",
      "pretty neat.",
    ],
  },
  {
    name: "pasta",
    url: "/api/pasta",
    image: pastaImage,
    imageTitle:
      "i think i took this from some PBS opengraph image. don't remember.",
    description:
      "a simple webpage + API endpoint for retrieving highly-curated copypasta",
    Icon: <Copy className="size-4" />,
    roots: [
      "src/features/pasta",
      "src/app/api/pasta",
      "src/app/api/health",
      "src/utils/ascii.ts",
    ],
    deps: ["the internet"],
    notes: [
      "just completely random copypasta that i've compiled. that's it.",
      "also accessible via the /api/health endpoint",
      "use the contact form if you'd like something added here.",
    ],
  },
  {
    name: "now playing [UNDER CONSTRUCTION]",
    url: "/now-playing",
    image: nowPlayingImage,
    description:
      "music visualizer + now playing info for my spotify account. currently under construction",
    Icon: <Headphones className="size-4" />,
    roots: ["src/services/spotify", "src/api/spotify"],
    deps: ["spotify"],
    notes: [
      "taking the now playing info that you can always see in the site header and adding a visualizer component to it + additional info about the track, like lyrics, album info, if i'm listening in a playlist, etc.",
    ],
  },
  // externalized to GeorgeIpsum/waSH
  // {
  //   name: "sandbox [UNDER CONSTRUCTION]",
  //   url: "/wash",
  //   image: hsabImage,
  //   description:
  //     "a terminal emulator for the web. currently under construction",
  //   Icon: Shell,
  //   roots: ["src/app/wash"],
  //   notes: [
  //     "uses xterm.js under the hood and also exposes some custom commands (yt-dlp + curl for now).",
  //     "leverages OPFS for a persistent filesystem in the browser.",
  //   ],
  // },
  {
    name: "fm [UNDER CONSTRUCTION]",
    url: "/fm",
    image: fmImage,
    description:
      "a home for my personal radio station. currently under construction",
    Icon: <Radio className="size-4" />,
    roots: ["src/app/fm"],
    deps: ["icecast", "liquidsoap", "ffmpeg"],
    notes: [
      "i needed a digital space to manage my amateur radio station and its broadcasts.",
      "this is it.",
    ],
  },
];
