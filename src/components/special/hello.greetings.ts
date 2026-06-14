import {
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

export const asciiArts = [
  ASCII_ART_TIPU,
  ASCII_ART_POM,
  ASCII_ART_CINN,
  ASCII_ART_LLAMA,
  ASCII_ART_HELLO,
  ASCII_ART_HELLO_THREATENING,
  ASCII_ART_PENGU,
  ASCII_ART_KITTY,
  ASCII_ART_OTTER,
  ASCII_ART_PANDA,
  ASCII_ART_DUCK,
  ASCII_ART_MIKU,
  ASCII_ART_DARGON,
  ASCII_ART_TOUCAN,
];

/**
 * Pick a random ascii art. Like `randomGreeting`, call this on the server at
 * request time (after `await connection()`) so the choice is made per request
 * and serialized into the HTML, matching the client's first render.
 */
export const randomAsciiArt = (): string =>
  asciiArts[Math.floor(Math.random() * asciiArts.length)];
