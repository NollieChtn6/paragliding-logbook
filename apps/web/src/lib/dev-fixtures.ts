// Identifiants de développement partagés entre le seed (prisma/seed.ts) et le
// code applicatif, tant qu'une vraie session (Better Auth) n'est pas en place
// côté requêtes. Le mot de passe n'est jamais en dur ici : voir DEV_USER_PASSWORD
// dans prisma/seed.ts, lu depuis une variable d'environnement.
export const DEV_USER_EMAIL = "dev@paragliding-logbook.local";
// Second compte de développement, pour vérifier manuellement que les
// activités sont bien isolées par utilisateur (ex. les vols créés avec l'un
// n'apparaissent pas dans l'historique de l'autre). Même mot de passe que
// DEV_USER_EMAIL (DEV_USER_PASSWORD), pas de variable dédiée.
export const DEV_USER_2_EMAIL = "dev2@paragliding-logbook.local";
export const TEST_SITE_NAME = "Saint-Hilaire-du-Touvet";
export const TEST_SCHOOL_NAME = "École de test";
