import {
  ASCII_3,
  ASCII_CINN,
  ASCII_CINN_SLEEP,
  ASCII_DARGON,
  ASCII_DUCK,
  ASCII_HANGYODON,
  ASCII_HELLO,
  ASCII_HELLO_THREATENING,
  ASCII_KEROPPI,
  ASCII_KITTY,
  ASCII_KITTY_EPIC,
  ASCII_KUCHIPATCHI,
  ASCII_KUROMI,
  ASCII_LLAMA,
  ASCII_MIKU,
  ASCII_OTTER,
  ASCII_PANDA,
  ASCII_PENGU,
  ASCII_POM,
  ASCII_TIPU,
  ASCII_TOUCAN,
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
  { ascii: ASCII_TIPU },
  { ascii: ASCII_POM, offset: { y: 0 } },
  { ascii: ASCII_CINN },
  { ascii: ASCII_LLAMA, anchor: "top-right", offset: { y: -2 } },
  { ascii: ASCII_HELLO },
  { ascii: ASCII_HELLO_THREATENING, offset: { x: 0 } },
  { ascii: ASCII_PENGU },
  { ascii: ASCII_KITTY, offset: { y: 2 } },
  { ascii: ASCII_OTTER, offset: { y: 2.5 } },
  { ascii: ASCII_PANDA, offset: { y: 1 } },
  { ascii: ASCII_DUCK },
  { ascii: ASCII_MIKU },
  { ascii: ASCII_DARGON, offset: { y: 0 } },
  { ascii: ASCII_TOUCAN, offset: { y: 0 } },
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
