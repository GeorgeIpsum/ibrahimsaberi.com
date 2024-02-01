"use client";

import Cookies from "js-cookie";

import { SITE_SETTINGS_COOKIE, THEME_COOKIE } from "@/_server/utils";

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
    const themeCookie = Cookies.get(THEME_COOKIE);
    if (themeCookie && (themeCookie === "light" || themeCookie === "dark")) {
      return themeCookie;
    }
  }
  return defaultTheme;
};

const LOCAL_THEME_STORAGE_KEY = "theme";

export const getCurrentTheme = (defaultTheme: Theme = DEFAULT_THEME): Theme =>
  (window.localStorage.getItem(LOCAL_THEME_STORAGE_KEY) as Theme) ??
  (Cookies.get(THEME_COOKIE) as Theme) ??
  (document.documentElement.dataset.mode as Theme) ??
  defaultTheme;

export const setDomTheme = (theme: Theme) => {
  document.documentElement.dataset.mode = theme;
  window.localStorage.setItem(LOCAL_THEME_STORAGE_KEY, theme);
  Cookies.set(THEME_COOKIE, theme);
};

export const resetDomTheme = () => {
  document.documentElement.dataset.mode = getUserPreferredTheme();
  window.localStorage.removeItem(LOCAL_THEME_STORAGE_KEY);
  Cookies.remove(THEME_COOKIE);
};

// dont question this. I know its Not Good™
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

export const getSiteSettings = () => Cookies.get(SITE_SETTINGS_COOKIE);

export const setSiteSettings = () => {};
