"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { getSystemContrast } from "./get-system-contrast";
import { getSystemTheme } from "./get-system-theme";
import type { Contrast, Theme } from "./types";

export const ThemeContext = createContext<
  | {
      theme: Theme;
      setTheme: (theme: Theme) => void;
      contrast: Contrast;
      setContrast: (contrast: Contrast) => void;
    }
  | undefined
>(undefined);

export const ThemeProvider: React.FC<
  PropsWithChildren<{ defaultTheme: Theme; defaultContrast: Contrast }>
> = ({ children, defaultTheme, defaultContrast }) => {
  const [theme, _setTheme] = useState<Theme>(
    typeof document === "undefined"
      ? defaultTheme
      : ((document.documentElement.dataset.theme as Theme) ?? defaultTheme),
  );
  const [contrast, _setContrast] = useState<Contrast>(
    typeof document === "undefined"
      ? defaultContrast
      : ((document.documentElement.dataset.contrast as Contrast) ??
          defaultContrast),
  );

  const setTheme = useCallback((theme: Theme) => {
    document.documentElement.dataset.theme =
      theme === "system" ? `system-${getSystemTheme()}` : theme;
    localStorage.theme = theme;
  }, []);

  const setContrast = useCallback((contrast: Contrast) => {
    document.documentElement.dataset.contrast =
      contrast === "system" ? `system-${getSystemContrast()}` : contrast;
    localStorage.contrast = contrast;
  }, []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "attributes") continue;
        if (mutation.attributeName === "data-theme") {
          const newTheme = document.documentElement.dataset.theme as Theme;
          if (newTheme !== theme) {
            _setTheme(newTheme);
          }
        }
        if (mutation.attributeName === "data-contrast") {
          const newContrast = document.documentElement.dataset
            .contrast as Contrast;
          if (newContrast !== contrast) {
            _setContrast(newContrast);
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-contrast"],
      childList: false,
    });
    return () => observer.disconnect();
  }, [theme, contrast]);

  useEffect(() => {
    if (theme !== "system-light" && theme !== "system-dark") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.dataset.theme = e.matches
        ? "system-dark"
        : "system-light";
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    if (contrast !== "system-normal" && contrast !== "system-high") return;
    const mq = matchMedia("(prefers-contrast: more)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.dataset.contrast = e.matches
        ? "system-high"
        : "system-normal";
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [contrast]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, contrast, setContrast }}>
      {children}
    </ThemeContext.Provider>
  );
};
