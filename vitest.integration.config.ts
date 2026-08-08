import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests d'intégration : nécessitent une vraie base Postgres locale
// (docker compose up -d) et DATABASE_URL (apps/web/.env). Volontairement
// hors de la CI pour l'instant (pnpm test / vitest.config.ts en restent
// indépendants) — script dédié : pnpm test:integration.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    setupFiles: ["./apps/web/src/test/integration-setup.ts"],
  },
});
