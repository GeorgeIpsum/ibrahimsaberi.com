"use client";

import { toggleDomTheme } from "@/utils-client/dom";

import { useDarkMode } from "./useDarkMode";

const ThemeToggle: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <input type="checkbox" checked={isDarkMode} onChange={toggleDomTheme} />
  );
};

export default ThemeToggle;
