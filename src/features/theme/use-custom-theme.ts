"use client";

import { useEffect } from "react";
import { type ColorTokens, tokenVarMap } from "./types";

const customThemeStyleExists = (name: string) =>
  [...document.styleSheets].some((sheet) =>
    [...sheet.cssRules].some((css) => {
      return css.cssText.includes(
        `:root[data-theme="custom"][data-custom-theme="${name}"]`,
      );
    }),
  );

export const useCustomTheme = (name: string, tokens?: ColorTokens) => {
  useEffect(() => {
    const entries = Object.entries(tokens ?? {});
    const originalTheme = document.documentElement.dataset.theme;
    const originalCustomTheme = document.documentElement.dataset.customTheme;

    if (
      originalCustomTheme === name &&
      originalTheme === "custom" &&
      entries.length === 0
    ) {
      return;
    }

    if (entries.length > 0 || customThemeStyleExists(name)) {
      document.documentElement.dataset.theme = "custom";
      document.documentElement.dataset.customTheme = name;
      console.log(document.documentElement.dataset.theme);

      entries.forEach(([token, value]) => {
        const cssVar = tokenVarMap[token as keyof ColorTokens];
        if (cssVar) {
          document.documentElement.style.setProperty(cssVar, value);
        }
      });

      return () => {
        document.documentElement.dataset.theme = originalTheme;
        document.documentElement.dataset.customTheme = originalCustomTheme;
      };
    } else {
      console.warn(`No CSS rules found for custom theme "${name}".`);
    }
  }, [name, tokens]);
};
