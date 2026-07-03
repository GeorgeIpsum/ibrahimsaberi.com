import { useEffect } from "react";
import { type ColorTokens, tokenVarMap } from "./types";

export const useCustomTheme = (tokens: ColorTokens) => {
  useEffect(() => {
    const entries = Object.entries(tokens);

    const originalTheme = document.documentElement.dataset.theme;
    if (entries.length > 0) {
      document.documentElement.dataset.theme = "custom";
    }

    entries.forEach(([token, value]) => {
      const cssVar = tokenVarMap[token as keyof ColorTokens];
      if (cssVar) {
        document.documentElement.style.setProperty(cssVar, value);
      }
    });

    return () => {
      document.documentElement.dataset.theme = originalTheme;
    };
  }, [tokens]);
};
