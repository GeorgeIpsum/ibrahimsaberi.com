import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";
import type * as React from "react";
import { fontBody, fontHeading, fontMono } from "./fonts";
import "./tailwind.css";

const preview: Preview = {
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
    // Apply the app's font CSS variables so type renders with the real fonts.
    (Story: React.FC) => (
      <div
        className={`${fontBody.variable} ${fontHeading.variable} ${fontMono.variable} font-sans text-foreground`}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
