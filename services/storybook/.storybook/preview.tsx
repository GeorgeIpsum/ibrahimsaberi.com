import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";
import type * as React from "react";
import { fontBody, fontHeading, fontMono } from "./fonts";
import "./tailwind.css";

// The app puts the next/font variable classes on <html> (src/app/layout.tsx),
// which is what lets portaled content (dialogs, popovers, toasts — mounted in
// <body>) inherit `html { font-family: var(--font-sans) }` from globals.css.
// A canvas-level decorator div can't do that: portals escape it and lose the
// variables, so fonts vanish from overlays while root-scoped colors survive.
document.documentElement.classList.add(
  fontBody.variable,
  fontHeading.variable,
  fontMono.variable,
);

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
  decorators: [
    // Toolbar toggle that flips `data-theme` on <html> to match the app's
    // `@custom-variant dark` selector and `:root[data-theme="…"]` tokens.
    withThemeByDataAttribute({
      attributeName: "data-theme",
      defaultTheme: "light",
      themes: { light: "light", dark: "dark" },
    }),
    // The font variables live on <html> above; this keeps canvas text on the
    // body font + foreground color for stories that render bare inline text.
    (Story: React.FC) => (
      <div className="font-sans text-foreground">
        <Story />
      </div>
    ),
  ],
};

export default preview;
