"use client";

import { useEffect, useState } from "react";

import { getInitialTheme, observeDomTheme } from "@/utils-client/dom";
import type { Theme } from "@/utils-client/types";

import { ThemeContextProvider } from "./useDarkMode";

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    observeDomTheme(setTheme);
    // return () => disconnect();
  }, []);

  return (
    <ThemeContextProvider
      value={{ theme: theme ?? "dark", isDarkMode: theme === "dark" }}
    >
      {children}
    </ThemeContextProvider>
  );
};
