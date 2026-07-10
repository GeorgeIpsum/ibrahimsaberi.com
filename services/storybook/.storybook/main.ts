import { resolve } from "node:path";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

// This package lives at services/storybook, so the app source is three
// directories up. The atoms import siblings via the `@/*` alias and resolve
// their own dependencies (react, @base-ui/react, …) from the repo root.
const srcDir = resolve(import.meta.dirname, "../../../src");

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y"
  ],
  // Lets `Hello` (an async server component awaiting `connection()`) render
  // directly in the browser preview instead of erroring as an unsupported
  // async component — see hello.stories.tsx.
  features: { experimentalRSC: true },
  viteFinal: async (cfg) => {
    const { mergeConfig } = await import("vite");
    return mergeConfig(cfg, {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          "@": srcDir,
          // `Hello` imports `connection()` from `next/server` — a Node-only
          // module. Swap in a same-signature browser stub so the RSC preview
          // can import it without pulling in Next's server runtime.
          "next/server": resolve(import.meta.dirname, "next-server-mock.ts"),
        },
        // Keep a single copy of React et al. so hooks work across the
        // repo-root atoms and this package's tooling.
        dedupe: ["react", "react-dom", "@base-ui/react"],
      },
      // Mirror Next/Turbopack's CSS pipeline: use Lightning CSS so `light-dark()`
      // (and other modern CSS) is lowered for older targets. Without it, Vite
      // leaves `light-dark()` raw and the browser rejects its non-color uses
      // (drop-shadow filters, color-mix percentages) — which work in the app
      // but broke only here. A target without native light-dark forces lowering.
      css: {
        transformer: "lightningcss",
        lightningcss: {
          targets: { safari: 16 << 16 },
        },
      },
      build: { cssMinify: "lightningcss" },
    });
  },
};

export default config;
