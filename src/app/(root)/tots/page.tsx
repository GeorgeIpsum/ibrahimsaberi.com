type OS = "nixos" | "macos" | "windows" | "ios";
interface Tool<T extends string = string> {
  name: T;
  platform?: OS;
  description?: string;
  years?: [number, number];
}
interface ToolGroup<T extends string = string> {
  tools: Tool<T>[];
}
type ToolGroups = Record<string, ToolGroup> & {
  hardware: ToolGroup<OS>;
};
const groups = {
  hardware: {
    tools: [
      {
        name: "macos",
      },
      {
        name: "nixos",
      },
      {
        name: "windows",
      },
      {
        name: "ios",
      },
    ],
  },
  "operating systems": {
    tools: [],
  },
  "terminals & shells": {
    tools: [],
  },
  text: {
    tools: [],
  },
  cli: {
    tools: [],
  },
  bots: {
    tools: [],
  },
  comms: {
    tools: [],
  },
  infra: {
    tools: [],
  },
  "supporting cast": {
    tools: [],
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
];
