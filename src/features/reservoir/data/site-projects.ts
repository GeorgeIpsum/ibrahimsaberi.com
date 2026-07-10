import {
  AudioLines,
  Copy,
  EthernetPort,
  Globe,
  Headphones,
  InspectionPanel,
  MirrorRectangular,
  Radio,
  Shell,
  TvMinimalPlay,
} from "lucide-react";
import type { SiteProject } from "../types";

export const siteProjects: SiteProject[] = [
  {
    name: "ibrahimsaberi.com",
    url: "/",
    imageHref: "/opengraph-image",
    description: "literally this website",
    Icon: Globe,
    roots: [""],
    notes: [
      "built with nextjs 16 (ppr), tailwind, mdx, coss ui/ base-ui.",
      "supporting cast of lucide-icons, a lot of rehype/ remark plugins (some homegrown), motion, three.js, cva, tsx, and a bunch of others.",
      "if (for whatever reason) you want to open a PR, a good place to start is grepping for `TODO` in the codebase. there are a handful.",
    ],
  },
  {
    name: "reflection",
    url: "/reflection",
    imageHref: "/reflection/opengraph-image",
    description: "a personality quiz a la Pokémon Mystery Dungeon",
    Icon: MirrorRectangular,
    roots: ["src/app/reflection", "src/features/reflection"],
    notes: [
      "mostly a project to test my motion knowledge, including some random CSS hacks and control-panel goodies.",
      "hopefully one-day this will help soft-launch some of the stuff you might see in the /heroes path in this repo.",
    ],
  },
  {
    name: "speedtest",
    url: "/speedtest",
    imageHref: "/speedtest/opengraph-image",
    description: "a simple network speed test tool",
    Icon: EthernetPort,
    roots: [
      "src/app/speedtest",
      "src/features/speedtest",
      "src/hooks/use-network-quality.ts",
    ],
    notes: [
      "a (very naive) speedtest implementation using XHR and the Network Information API.",
      "probably not super accurate, and location detection relies entirely on Vercel's edge network/ their IP geolocation info, but it gets the job done.",
      "at least your ISP won't detect that this is a speedtest and start boosting your bandwidth.",
    ],
  },
  {
    name: "control panel",
    url: "/",
    imageHref: "/img/pages/reservoir/control-panel.png",
    description: "a drop-in modal control panel",
    Icon: InspectionPanel,
    roots: ["src/features/control-panel"],
    notes: [
      "i found the leva library and wanted to build my own version using mobx internal observable state.",
      "it's grown into a pretty cool tool that i can use during dev/ realtime to tweak things on the fly.",
      "press ctrl+k to see this right now.",
    ],
  },
  {
    name: "dota2 voicelines",
    url: "/api/audio/voice-responses",
    imageHref: "/img/pages/reservoir/dota2-voicelines.png",
    imageTitle:
      "unceremoniously yoinked from https://www.youtube.com/watch?v=cNubRZduGDs",
    description: "a simple API endpoint for getting dota2 voice lines",
    Icon: AudioLines,
    roots: [
      "src/app/api/audio/voice-responses",
      ".scripts/dota2-voicelines",
      ".github/workflows/upload-assets-r2.yml",
    ],
    notes: [
      "something I wanted to create so I don't have to constantly throw traffic at liquipedia for dota2 voicelines.",
      "accepted query params are `hero`, `voiceline` and `category`.",
    ],
  },
  {
    name: "yt-dlp-wasm",
    url: "/viddles",
    imageHref: "/viddles/opengraph-image",
    description:
      "yt-dlp compiled to WebAssembly, usable on the web (with some additional but necessary cruft)",
    Icon: TvMinimalPlay,
    roots: [
      "src/app/viddles",
      "src/app/yt-dlp-test",
      "src/services/yt-dlp",
      "packages/yt-dlp-wasm",
      "services/wisp-server",
      ".github/workflows/deploy-wisp.yml",
    ],
    notes: [
      "i literally just wanted to see Fable 5 create something end-to-end. it did.",
      "pretty neat.",
    ],
  },
  {
    name: "pasta",
    url: "/api/pasta",
    imageHref: "/img/pages/reservoir/pasta.png",
    imageTitle:
      "i think i took this from some PBS opengraph image. don't remember.",
    description:
      "a simple webpage + API endpoint for retrieving highly-curated copypasta",
    Icon: Copy,
    roots: ["src/app/api/pasta", "src/app/api/health"],
    notes: [
      "just completely random copypasta that i've compiled. that's it.",
      "also accessible via the /api/health endpoint",
      "use the contact form if you'd like something added here.",
    ],
  },
  {
    name: "now playing [UNDER CONSTRUCTION]",
    url: "/now-playing",
    imageHref: "/now-playing/opengraph-image",
    description:
      "music visualizer + now playing info for my spotify account. currently under construction",
    Icon: Headphones,
    roots: ["src/services/spotify", "src/api/spotify"],
    notes: [
      "taking the now playing info that you can always see in the site header and adding a visualizer component to it + additional info about the track, like lyrics, album info, if i'm listening in a playlist, etc.",
    ],
  },
  {
    name: "sandbox [UNDER CONSTRUCTION]",
    url: "/hsab",
    imageHref: "/hsab/opengraph-image",
    description:
      "a terminal emulator for the web. currently under construction",
    Icon: Shell,
    roots: ["src/app/hsab"],
    notes: [
      "uses xterm.js under the hood and also exposes some custom commands (yt-dlp + curl for now).",
      "leverages OPFS for a persistent filesystem in the browser.",
    ],
  },
  {
    name: "fm [UNDER CONSTRUCTION]",
    url: "/fm",
    imageHref: "/fm/opengraph-image",
    description:
      "a home for my personal radio station. currently under construction",
    Icon: Radio,
    roots: ["src/app/fm"],
    notes: [
      "i needed a digital space to manage my amateur radio station and its broadcasts.",
      "this is it.",
    ],
  },
];
