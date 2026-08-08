// Identifiants de développement partagés entre le seed (prisma/seed.ts) et le
// code applicatif, tant qu'Auth.js n'est pas en place (pas de vraie session).
export const DEV_USER_EMAIL = "dev@paragliding-logbook.local";
// Mot de passe en clair uniquement ici, dans le code de seed : jamais stocké
// tel quel en base (voir hashPassword dans src/lib/password.ts).
export const DEV_USER_PASSWORD = "dev-fixture-password";
export const TEST_SITE_NAME = "Site de test";
