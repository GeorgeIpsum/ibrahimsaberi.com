"use client";

import { toggleDomTheme } from "@/_client/dom";

import { useDarkMode } from "./useDarkMode";

const ThemeToggle: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <input
      className="theme"
      type="checkbox"
      data-checkbox="switch"
      checked={isDarkMode}
      onChange={toggleDomTheme}
    />
  );
};

export default ThemeToggle;
