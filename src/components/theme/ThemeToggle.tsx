"use client";

import { cx } from "class-variance-authority";

import { toggleDomTheme } from "@/_client/dom";

import styles from "./ThemeToggle.module.css";
import { useDarkMode } from "./useDarkMode";

const ThemeToggle: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <input
      type="checkbox"
      className={cx("theme", styles.theme)}
      checked={isDarkMode}
      onChange={toggleDomTheme}
    />
  );
};

export default ThemeToggle;
