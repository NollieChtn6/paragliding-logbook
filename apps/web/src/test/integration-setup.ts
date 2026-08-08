import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Vitest ne charge pas les fichiers .env automatiquement (contrairement à
// Next.js) : chargement explicite de apps/web/.env pour DATABASE_URL.
config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });
