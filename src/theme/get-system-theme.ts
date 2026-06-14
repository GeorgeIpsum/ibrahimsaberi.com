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

export const resolveTheme = (theme: Theme): "light" | "dark" => {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  if (theme === "system-light") return "light";
  if (theme === "system-dark") return "dark";
  return getSystemTheme() as "light" | "dark";
};
