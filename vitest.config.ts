import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

// Tests d'intégration (*.integration.test.ts, vraie base Postgres) exclus de
// la suite par défaut : voir vitest.integration.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    passWithNoTests: true,
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});
