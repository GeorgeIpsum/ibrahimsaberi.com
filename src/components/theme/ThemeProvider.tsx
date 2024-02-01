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
    const d = new BroadcastChannel("s-channel");
    d.postMessage("s");
    function messageListener(
      this: BroadcastChannel,
      message: MessageEvent<any>
    ) {
      console.log(this.name, message);
    }
    d.addEventListener("message", messageListener);
    return () => {
      d.removeEventListener("message", messageListener);
    };
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
