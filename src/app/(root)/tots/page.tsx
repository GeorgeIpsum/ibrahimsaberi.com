import "maplibre-gl/dist/maplibre-gl.css";
import type { StaticImageData } from "next/image";

// overtyped garbage.
type OS = "nixos" | "macos" | "windows" | "ios";
type Tool<T extends string = string> = {
  name: T;
  description?: string;
  image?: StaticImageData;
  years?: [number, number];
  link?: string;
  underTheFold?: true;
} & (
  | { evaluating?: true }
  | {
      lookingForReplacement?: true;
      evaluating?: Pick<Tool<T>, "name" | "description" | "link" | "image">[];
    }
) &
  (
    | {
        platform?: OS | OS[];
      }
    | {
        platform: OS;
        alternatives: Pick<
          Omit<Tool<T>, "alternatives">,
          "name" | "description" | "link" | "platform" | "image"
        >[];
      }
  );
interface ToolGroup<T extends string = string> {
  tools: Tool<T>[];
  size?: "small" | "medium" | "large";
  classNames?: {
    name?: string;
    description?: string;
    image?: string;
  };
}
type ToolGroups = Record<string, ToolGroup> & {
  "operating systems": ToolGroup<OS>;
};
const groups = {
  "operating systems": {
    tools: [
      {
        name: "macos",
      },
      {
        name: "nixos",
      },
      {
        name: "ios",
      },
    ],
  },
  "terminals & shells": {
    tools: [
      {
        name: "iterm2",
      },
      {
        name: "omz",
      },
      {
        name: "p10k",
      },
      {
        name: "alacritty",
      },
    ],
  },
  text: {
    size: "large",
    tools: [
      {
        name: "zed",
        description:
          "swapped from vscode because the amount of time i was spending editing .vscode/settings.json for performance tuning on a literal m4 pro chip was something out of a nightmare.",
      },
      {
        name: "vscode",
        description:
          "for whenever i need to use liveshare to teach a junior or pair program with a team member.",
      },
      {
        name: "neovim",
        description: "nixos editor of choice. lean. mean. clean. green.",
      },
      {
        name: "vi",
        description: `picture this: you ssh into a server, run vi, make a bunch of edits, realize you don't actually have edit permissions because for whatever reason you're blind to the "read-only" warning, and then you repeat the entire thing with sudo vi.`,
      },
    ],
  },
  cli: {
    size: "small",
    tools: [
      {
        name: "mise",
        description:
          "i got so tired of nvm blowing up my shell env that i had my entire team swap to this. it's actually incredible.",
      },
      {
        name: "bat",
        description:
          "imagine if cats could fly. and could also highlight syntax.",
      },
      {
        name: "exa",
        description:
          "ls but cooler. also sounds cooler. also confuses my team.",
      },
      {
        name: "ripgrep",
        description: `100 more years of "rebuild it in rust"`,
      },
      {
        name: "doggo",
        description:
          "dns client (think dig). there's a go fetch joke here but i'm not funny enough to find it.",
      },
      {
        name: "ffmpeg",
        description:
          "people think xkcd.com/2347/ is about bash but it's actually about alternate universe ffmpeg. i'll explain later.",
        underTheFold: true,
      },
      {
        name: "yt-dlp",
        description: "VIVA LA RÉSISTANCE",
        underTheFold: true,
      },
      {
        name: "catimg",
        description: "further proof that imagemagick is actual black magic.",
        underTheFold: true,
      },
      {
        name: "jq",
        description: `"json is human-readable" <- absolutely deranged man`,
        underTheFold: true,
      },
      {
        name: "bearer",
        description: "neat static analysis tool.",
        underTheFold: true,
      },
      {
        name: "harfbuzz",
        description:
          "text shaping engine. i don't really know what that means either.",
        underTheFold: true,
      },
      { name: "imagemagick", description: "black magic.", underTheFold: true },
      {
        name: "hurl",
        description:
          "http request chainer, useful for testing. really nice for CI.",
      },
      {
        name: "lnav",
        description:
          "log soup viewer/ navigator. really useful for homelab/ home assistant debugging.",
      },
      {
        name: "sox",
        description: "more black magic i'm pretty sure.",
        underTheFold: true,
      },
      {
        name: "tesseract",
        description:
          "REMARKABLY good ocr considering the overall footprint. actually still amazes me how it can properly pick up the weirdest chicken scratch.",
        underTheFold: true,
      },
      {
        name: "sniffnet",
        description: "network traffic monitor.",
        underTheFold: true,
      },
      {
        name: "lonk",
        description: "homegrown local link shortener utility. i made this :)",
        underTheFold: true,
      },
      {
        name: "litime",
        description:
          "prints quotes from media that contain the current time (hour + minute). invoked on shell start. very occasionally will print a quote that could get me into trouble at work. buyer beware.",
      },
      {
        name: "zoxide",
        description: "smarter cd.",
      },
    ],
  },
  bots: {
    size: "large",
    tools: [
      {
        name: "claude",
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
  },
  infra: {
    size: "medium",
    tools: [],
  },
  audio: {
    size: "medium",
    tools: [],
  },
  hardware: {
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
        description:
          "imo a little overrated but i illmatic is still a classic.",
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
  },
  "supporting cast": {
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
  },
} satisfies ToolGroups;

export default async function Page() {
  return null;
}

const toolsOfThe = [
  "shade",
  "saberi",
  "scribe",
  "sycamore",
  "sovereign",
  "salmon",
  "sheboygan",
  "samurai",
  "sorbet",
  "sorceress",
  "starship",
  "storefront",
  "slacker",
  "stew",
  "shamwow",
  "sock puppet",
  "shroud",
  "shroomish",
  "scallywag",
  "saucier",
  "sap",
  "scuttlebut",
  "saffronite",
  "slurrrrrrrrrrp",
];
