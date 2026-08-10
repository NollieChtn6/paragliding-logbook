# paragliding-logbook

**THERMIK** — Carnet de vols & progression

Carnet de bord personnel de parapente (vols, stages, gonflages, statistiques).

Voir [CLAUDE.md](./CLAUDE.md) pour le contexte projet, la stack technique et les conventions.

## Prérequis

- Node.js >= 22
- pnpm 10 (`packageManager` défini dans `package.json`)
- Docker (PostgreSQL local via `docker-compose.yml`)

## Installation

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
docker compose up -d
pnpm prisma:migrate
pnpm prisma:seed
```

`apps/web/.env` doit être complété avant le seed : `BETTER_AUTH_SECRET` (secret de signature des sessions, ex. `openssl rand -base64 32`). Créez ensuite un compte via `/sign-up` pour vous connecter à l'application.

## Scripts

| Commande | Description |
| --- | --- |
| `pnpm dev` | Lance l'application Next.js (`apps/web`) en développement |
| `pnpm build` | Build de production de `apps/web` |
| `pnpm start` | Démarre le build de production de `apps/web` |
| `pnpm lint` | Vérifie le code avec Biome |
| `pnpm lint:fix` | Corrige automatiquement ce qui peut l'être |
| `pnpm format` | Formate le code avec Biome |
| `pnpm typecheck` | Vérifie les types TypeScript (racine + `apps/web`) |
| `pnpm test` | Exécute les tests unitaires avec Vitest (aucune base requise) |
| `pnpm test:integration` | Exécute les tests d'intégration (nécessite PostgreSQL local, `docker compose up -d`) |
| `pnpm prisma:generate` | Régénère le client Prisma |
| `pnpm prisma:migrate` | Crée/applique une migration Prisma |
| `pnpm prisma:seed` | Peuple les données de référence (`ActivityType`, site de test) |
| `pnpm prisma:studio` | Ouvre Prisma Studio pour visualiser la base locale |

## Qualité de code

- **Biome** : lint + format (voir `biome.json`)
- **Husky** + **lint-staged** : vérifications automatiques avant chaque commit
- **GitHub Actions** (`.github/workflows/ci.yml`) : install, lint, typecheck, test sur chaque push/PR vers `main` et `develop` (les tests d'intégration ne font volontairement pas partie de la CI pour l'instant, ils nécessitent une base PostgreSQL)

## Versionnage

SemVer automatisé via [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release.yml`) : chaque merge sur `main` met à jour une "Release PR" (bump `apps/web/package.json` + `apps/web/CHANGELOG.md` à partir des Conventional Commits) ; la merger crée le tag Git `vX.Y.Z` et la GitHub Release correspondants. Détail du choix : [ADR 006](./docs/decisions/006-versioning.md). Version affichée dans l'interface (`components/version-badge.tsx`), SHA du commit déployé en complément (survol, desktop).

## Structure

Monorepo pnpm workspaces (`apps/*`, `packages/*`) :

- `apps/web` : application Next.js (App Router, TypeScript strict, Tailwind CSS, shadcn/ui)
  - `prisma/` : schéma Prisma (dont les modèles Better Auth : `Session`/`Account`/`Verification`), migrations, seed
  - `src/lib/auth.ts` : instance serveur Better Auth (adaptateur Prisma, hash Argon2, inscription publique activée)
  - `src/lib/current-user.ts` : résolution de l'utilisateur courant à partir de la vraie session (`getCurrentUser`), variante qui redirige vers `/sign-in` si absente (`requireCurrentUser`), variante qui exige en plus le rôle `ADMIN` (`requireAdmin`)
  - `src/proxy.ts` : protection des routes `/`, `/activities`, `/activities/:path*`, `/flights/new` et `/admin/*` (vérification optimiste de session, redirige vers `/sign-in`)
  - `src/lib/validations/` : schémas Zod par domaine métier — `Flight`, `TrainingCamp`, `GroundHandlingSession`, `Site`, `SitePoint` et `School` complets et testés ; `Activity` en structure seule pour l'instant
  - `src/features/` : couche métier par feature, indépendante de l'UI — `flights/`, `training-camps/`, `ground-handling-sessions/` (création), `activities/` (lecture : liste et détail, tous types d'activité confondus), `auth/` (inscription, `signUp`), `account/` (changement de mot de passe), `dashboard/` (statistiques + activités récentes, dérivées de `activities/` sans requête Prisma supplémentaire), `sites/`, `site-points/` et `schools/` (référentiels partagés, CRUD réservé à `/admin`)
  - `src/actions/` : Server Actions Next.js (dont `sign-in.ts`, `sign-up.ts`, `create-site.ts`, `create-site-point.ts`, `create-school.ts` et leurs équivalents `update-*`/`delete-*`)
  - `src/app/page.tsx` : dashboard (page d'accueil authentifiée)
  - `src/app/sign-in` : page de connexion email + mot de passe
  - `src/app/sign-up` : page d'inscription email + mot de passe
  - `src/app/activities` : parcours applicatif — `new` (choix du type d'activité puis formulaire), liste et `[id]` (détail)
  - `src/app/flights/new` : route de test historique (même formulaire partagé que `/activities/new`)
  - `src/app/admin` : espace d'administration réservé au rôle `ADMIN` (`requireAdmin()`) — tableau de bord, gestion des sites (`sites`), des points de site (`site-points`) et des écoles (`schools`)

Base de données : PostgreSQL (local via Docker), Prisma ORM. Validation : Zod. Authentification : Better Auth (email + mot de passe, hash Argon2, inscription publique) — voir [CLAUDE.md](./CLAUDE.md#authentification).

Voir [docs/todo.md](./docs/todo.md) pour le détail de l'avancement.
