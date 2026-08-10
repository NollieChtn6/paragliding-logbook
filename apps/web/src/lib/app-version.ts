import packageJson from "../../package.json";

// Bumpé automatiquement par release-please (.release-please-config.json) à
// chaque merge sur main, en même temps que le tag Git correspondant — pas de
// double maintenance manuelle.
export const APP_VERSION: string = packageJson.version;

// Fournie par Vercel, ré-exposée au client via next.config.ts (voir son
// commentaire) : absente en développement local.
export const APP_COMMIT_SHA = process.env.NEXT_PUBLIC_APP_COMMIT_SHA;
