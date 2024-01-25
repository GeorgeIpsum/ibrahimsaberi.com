"use client";

import { Theme } from "./types";

export const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const peristentTheme = window.localStorage.getItem("theme");

    if (peristentTheme === "dark" || peristentTheme === "light") {
      return peristentTheme;
    }

    const mqTheme = window.matchMedia("(prefers-color-scheme: dark)");

    return mqTheme.matches ? "dark" : "light";
  }
  return "dark";
};

const themeStorageKey = "theme";

export const getCurrentTheme = (): Theme =>
  (window.localStorage.getItem(themeStorageKey) as Theme) ??
  (document.documentElement.dataset.mode as Theme) ??
  "light";

export const setDomTheme = (theme: Theme) => {
  document.documentElement.dataset.mode = theme;
  window.localStorage.setItem("theme", theme);
};

// dont question this. I know its Not GoodTM
const themeSwapMap: Record<Theme, Theme> = {
  dark: "light",
  light: "dark",
};

export const toggleDomTheme = () => {
  const currentTheme = getCurrentTheme();
  setDomTheme(themeSwapMap[currentTheme]);
};

export const observeDomTheme = (callback: (theme: Theme) => unknown) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.attributeName === "data-mode" &&
        mutation.target === document.documentElement
      ) {
        callback(document.documentElement.dataset.mode as Theme);
      }
    });
  });

  observer.observe(document.documentElement, { attributes: true });

  return observer.disconnect;
};
