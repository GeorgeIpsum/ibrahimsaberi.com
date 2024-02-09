import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-mode="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.svg",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        head: ["var(--font-head)"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/aspect-ratio"),
    // require("@tailwindcss/forms"),
    require("tailwind-children"),
  ],
};
export default config;
