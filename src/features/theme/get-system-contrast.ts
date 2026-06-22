import type { Contrast } from "./types";

export const getSystemContrast = (): Contrast => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia === "undefined"
  ) {
    return "normal";
  }

  return window.matchMedia("(prefers-contrast: more)").matches
    ? "high"
    : "normal";
};
