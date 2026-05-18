import { cookies, headers } from "next/headers";
import { cache } from "react";
import { THEME_COOKIE_NAME, type Theme } from "./types";

export const getSystemThemeRSC = cache(async (): Promise<Theme> => {
  const themeCookie = (await cookies()).get(THEME_COOKIE_NAME)?.value;
  if (themeCookie === "light" || themeCookie === "dark") {
    return themeCookie;
  }

  const defaultTheme = (await headers()).get("Sec-CH-Prefers-Color-Scheme");
  if (defaultTheme === "light" || defaultTheme === "dark") {
    return defaultTheme as Theme;
  }

  return "system";
});
