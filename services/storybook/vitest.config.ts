import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          // Preview annotations (theme/font decorators) are auto-applied by addon-vitest since SB 10.3 — no setup file needed.
          // Loads .storybook/main.ts (including viteFinal: tailwind, `@` alias,
          // react dedupe, lightningcss) so tests build exactly like the dev server.
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "pnpm dev --no-open",
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
