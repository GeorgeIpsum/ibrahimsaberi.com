import {
  ASCII_3,
  ASCII_ART_CINN,
  ASCII_ART_DARGON,
  ASCII_ART_DUCK,
  ASCII_ART_HELLO,
  ASCII_ART_HELLO_THREATENING,
  ASCII_ART_KITTY,
  ASCII_ART_LLAMA,
  ASCII_ART_MIKU,
  ASCII_ART_OTTER,
  ASCII_ART_PANDA,
  ASCII_ART_PENGU,
  ASCII_ART_POM,
  ASCII_ART_TIPU,
  ASCII_ART_TOUCAN,
  ASCII_CINN_SLEEP,
  ASCII_HANGYODON,
  ASCII_KEROPPI,
  ASCII_KITTY_EPIC,
  ASCII_KUCHIPATCHI,
  ASCII_KUROMI,
} from "@/utils/ascii";

export const greetings = [
  "yello.",
  "hello.",
  "howdy.",
  "hi.",
  "hey.",
  "greetings.",
  "yo.",
  "salaam.",
];

/**
 * Pick a random greeting. Call this on the server at request time (after
 * `await connection()`) so the choice is made once per request and serialized
 * into the HTML — the client then receives it as a prop, so the first client
 * render matches the server render instead of re-rolling its own greeting.
 */
export const randomGreeting = (): string =>
  greetings[Math.floor(Math.random() * greetings.length)];

export interface HelloAsciiArt {
  ascii: string;
  offset?: { x?: number; y?: number };
  anchor?: "right" | "bottom-right" | "top-right";
  color?: string;
}
export const asciiArts = [
  { ascii: ASCII_ART_TIPU },
  { ascii: ASCII_ART_POM, offset: { y: 0 } },
  { ascii: ASCII_ART_CINN },
  { ascii: ASCII_ART_LLAMA, anchor: "top-right", offset: { y: -2 } },
  { ascii: ASCII_ART_HELLO },
  { ascii: ASCII_ART_HELLO_THREATENING, offset: { x: 0 } },
  { ascii: ASCII_ART_PENGU },
  { ascii: ASCII_ART_KITTY, offset: { y: 2 } },
  { ascii: ASCII_ART_OTTER, offset: { y: 2.5 } },
  { ascii: ASCII_ART_PANDA, offset: { y: 1 } },
  { ascii: ASCII_ART_DUCK },
  { ascii: ASCII_ART_MIKU },
  { ascii: ASCII_ART_DARGON, offset: { y: 0 } },
  { ascii: ASCII_ART_TOUCAN, offset: { y: 0 } },
  { ascii: ASCII_KUCHIPATCHI, anchor: "top-right", offset: { y: 0 } },
  { ascii: ASCII_3, anchor: "top-right", offset: { y: -0.4 }, color: "#0FF" },
  { ascii: ASCII_KUROMI, offset: { y: 0 } },
  { ascii: ASCII_CINN_SLEEP, offset: { y: 0 } },
  { ascii: ASCII_KITTY_EPIC, anchor: "top-right", offset: { y: -3 } },
  { ascii: ASCII_HANGYODON, anchor: "top-right", offset: { y: -6 } },
  { ascii: ASCII_KEROPPI, anchor: "top-right", offset: { y: 0 } },
] as const satisfies HelloAsciiArt[];

/**
 * Pick a random ascii art. Like `randomGreeting`, call this on the server at
 * request time (after `await connection()`) so the choice is made per request
 * and serialized into the HTML, matching the client's first render.
 */
export const randomAsciiArt = (): HelloAsciiArt =>
  asciiArts[Math.floor(Math.random() * asciiArts.length)];
