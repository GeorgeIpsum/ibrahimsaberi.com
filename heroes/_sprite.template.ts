import { type } from "arktype";

/**
 * Base Spritesheet logic:
 * - 10x5 base grid
 */
export const sprites = type("string").pipe((spriteSheet) => {
  const lines = spriteSheet.split("\n");
  if (lines.length % 5 !== 0) {
    throw new Error("Invalid sprite sheet: expected a multiple of 5 lines");
  }
  if (lines.some((line) => line.length !== 10)) {
    throw new Error(
      "Invalid sprite sheet: expected each line to be 10 characters long",
    );
  }

  const sprites = [];
  for (let i = 0; i < lines.length; i += 5) {
    sprites.push(lines.slice(i, i + 5).join("\n"));
  }
  return sprites;
});

/**
 * Overworld Spritesheet logic:
 * - 5x5 base grid
 */
export const overworldSprites = type("string").pipe((_spriteSheet) => {});
