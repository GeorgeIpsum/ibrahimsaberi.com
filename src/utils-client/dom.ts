"use client";

import Cookies from "js-cookie";
import { THEME_COOKIE_NAME } from "@/utils/dom";
import { Theme } from "./types";

const DEFAULT_THEME: Theme = "dark";

const getUserPreferredTheme = (): Theme => {
  const mqTheme = window.matchMedia("(prefers-color-scheme: dark)");
  return mqTheme.matches ? "dark" : "light";
};

export const getInitialTheme = (defaultTheme: Theme = DEFAULT_THEME): Theme => {
  if (typeof window !== "undefined") {
    const peristentTheme = window.localStorage.getItem("theme");

    if (peristentTheme === "dark" || peristentTheme === "light") {
      return peristentTheme;
    }

    return getUserPreferredTheme();
  } else if (typeof document !== "undefined") {
    const themeCookie = Cookies.get(THEME_COOKIE_NAME);
    if (themeCookie && (themeCookie === "light" || themeCookie === "dark")) {
      return themeCookie;
    }
  }
  return defaultTheme;
};

const themeStorageKey = "theme";

export const getCurrentTheme = (defaultTheme: Theme = DEFAULT_THEME): Theme =>
  (window.localStorage.getItem(themeStorageKey) as Theme) ??
  (Cookies.get(THEME_COOKIE_NAME) as Theme) ??
  (document.documentElement.dataset.mode as Theme) ??
  defaultTheme;

export const setDomTheme = (theme: Theme) => {
  document.documentElement.dataset.mode = theme;
  window.localStorage.setItem(themeStorageKey, theme);
  Cookies.set(THEME_COOKIE_NAME, theme);
};

export const resetDomTheme = () => {
  document.documentElement.dataset.mode = getUserPreferredTheme();
  window.localStorage.removeItem(themeStorageKey);
  Cookies.remove(THEME_COOKIE_NAME);
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
