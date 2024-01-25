"use client";

import { createContext, useContext } from "react";

import { getInitialTheme } from "../../utils-client/dom";
import { Theme } from "../../utils-client/types";

const ThemeContext = createContext<{ theme: Theme; isDarkMode: boolean }>({
  theme: getInitialTheme(),
  isDarkMode: getInitialTheme() === "dark",
});
export const ThemeContextProvider = ThemeContext.Provider;

export const useDarkMode = () => useContext(ThemeContext);
