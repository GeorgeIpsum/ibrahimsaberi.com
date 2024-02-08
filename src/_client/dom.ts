"use client";

import Cookies from "js-cookie";

import {
  type CookieDeserializer,
  type CookieRepo,
  type CookieSerializer,
  SITE_SETTINGS_COOKIE,
  type SiteSettings,
  THEME_COOKIE,
} from "@/_server/utils/cookies";

import { Theme } from "./types";

const DEFAULT_THEME: Theme = "dark";

const getUserPreferredTheme = (): Theme => {
  const mqTheme = window.matchMedia("(prefers-color-scheme: dark)");
  return mqTheme.matches ? "dark" : "light";
};

export const cookieSerializer = <T>(value: T) => btoa(JSON.stringify(value));
export const cookieDeserializer = <T>(value: string) =>
  JSON.parse(atob(value)) as T;

const setCookieObject = <T = any>(
  cookie: string,
  value?: T,
  serializer?: CookieSerializer<T>
) => {
  if (!value) {
    Cookies.remove(cookie);
    return document.cookie;
  }

  const defaultSerializer: CookieSerializer<T> = cookieSerializer;
  const toSerialized = serializer ?? defaultSerializer;

  return Cookies.set(cookie, toSerialized(value)) as string;
};

const getCookieObject = <T = any>(
  cookie: string,
  deserializer?: CookieDeserializer<T>
): T | undefined => {
  const rawValue = Cookies.get(cookie);
  if (!rawValue) return undefined;

  const defaultDeserializer: CookieDeserializer<T> = cookieDeserializer;
  const toDeserialized = deserializer ?? defaultDeserializer;

  return toDeserialized(rawValue);
};

const buildCookieRepo = <T = any>(
  cookie: string,
  transformer?: {
    serializer?: CookieSerializer<T>;
    deserializer?: CookieDeserializer<T>;
  }
) => {
  return {
    get: () => getCookieObject(cookie, transformer?.deserializer),
    set: (value?: T) => setCookieObject(cookie, value, transformer?.serializer),
  };
};

export const domCookie = (): CookieRepo => {
  return {
    theme: buildCookieRepo<Theme>(THEME_COOKIE, {
      serializer: (value: Theme) => value,
      deserializer: (value: string) => value as Theme,
    }),
    site: buildCookieRepo<SiteSettings>(SITE_SETTINGS_COOKIE),
  };
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
  (domCookie().theme.get() as Theme) ??
  (document.documentElement.dataset.mode as Theme) ??
  defaultTheme;

export const setDomTheme = (theme: Theme) => {
  document.documentElement.dataset.mode = theme;
  window.localStorage.setItem(LOCAL_THEME_STORAGE_KEY, theme);
  domCookie().theme.set(theme);
};

export const resetDomTheme = () => {
  document.documentElement.dataset.mode = getUserPreferredTheme();
  window.localStorage.removeItem(LOCAL_THEME_STORAGE_KEY);
  domCookie().theme.set(undefined);
};

// dont question this. I know it is very Why(?)™
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
