// Identifiants de développement partagés entre le seed (prisma/seed.ts) et le
// code applicatif, tant qu'une vraie session (Better Auth) n'est pas en place
// côté requêtes. Le mot de passe n'est jamais en dur ici : voir DEV_USER_PASSWORD
// dans prisma/seed.ts, lu depuis une variable d'environnement.
export const DEV_USER_EMAIL = "dev@paragliding-logbook.local";
export const TEST_SITE_NAME = "Site de test";
