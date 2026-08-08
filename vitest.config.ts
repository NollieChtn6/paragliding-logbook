import { configDefaults, defineConfig } from "vitest/config";

// Tests d'intégration (*.integration.test.ts, vraie base Postgres) exclus de
// la suite par défaut : voir vitest.integration.config.ts.
export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});
