import type { Theme } from "./types";

export const getSystemTheme = (): Theme => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia === "undefined"
  ) {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};
