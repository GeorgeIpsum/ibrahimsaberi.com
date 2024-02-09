"use client";

const vars = [
  "--font-head",
  "--font-body",
  "--gradient-color-1",
  "--gradient-color-2",
  "--gradient-color-3",
  "--gradient-color-4",
];
const getCssVars = () => {
  const styles = window.getComputedStyle(document.documentElement);
  const cssVars = Object.fromEntries(
    vars.map((v) => [v, styles.getPropertyValue(v)])
  );

  return cssVars;
};

if (!window.settings) {
  window.settings = new Proxy(
    {},
    {
      get: (target, prop, receiver) => {
        return target[prop];
      },
      set: (target, prop, newValue, receiver) => {
        target[prop] = newValue;
        return true;
      },
    }
  );
}

const loadSettings = () => {
  window.settings.css = getCssVars();
};

if (document.readyState !== "complete") {
  document.addEventListener("DOMContentLoaded", loadSettings);
} else {
  loadSettings();
}
