"use client";

import { useEffect, useState } from "react";

import { getInitialTheme, observeDomTheme } from "@/_client/dom";
import type { Theme } from "@/_client/types";

import { ThemeContextProvider } from "./useDarkMode";

interface ThemeProviderProps {
  defaultTheme?: Theme;
}
export const ThemeProvider: React.FC<
  React.PropsWithChildren<ThemeProviderProps>
> = ({ children, defaultTheme }) => {
  const [theme, setTheme] = useState<Theme>(() =>
    getInitialTheme(defaultTheme)
  );

  useEffect(() => {
    observeDomTheme(setTheme);
    // return () => disconnect();
  }, []);

  return (
    <ThemeContextProvider
      value={{
        theme,
        isDarkMode: theme === "dark",
      }}
    >
      {children}
    </ThemeContextProvider>
  );
};
