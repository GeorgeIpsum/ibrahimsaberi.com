import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // `import "server-only"` throws outside a React Server Component. Point
      // it at the package's own react-server no-op so server modules can be
      // imported into unit tests.
      "server-only": path.resolve(
        import.meta.dirname,
        "node_modules/server-only/empty.js",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/*.{test,spec}.{ts,tsx}"],
  },
});
