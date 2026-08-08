# paragliding-logbook

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
| `pnpm prisma:seed` | Peuple les données de référence (`ActivityType`, utilisateur et site de développement) |
| `pnpm prisma:studio` | Ouvre Prisma Studio pour visualiser la base locale |

## Qualité de code

- **Biome** : lint + format (voir `biome.json`)
- **Husky** + **lint-staged** : vérifications automatiques avant chaque commit
- **GitHub Actions** (`.github/workflows/ci.yml`) : install, lint, typecheck, test sur chaque push/PR vers `main` et `develop` (les tests d'intégration ne font volontairement pas partie de la CI pour l'instant, ils nécessitent une base PostgreSQL)

## Structure

Monorepo pnpm workspaces (`apps/*`, `packages/*`) :

- `apps/web` : application Next.js (App Router, TypeScript strict, Tailwind CSS, shadcn/ui)
  - `prisma/` : schéma Prisma, migrations, seed
  - `src/lib/validations/` : schémas Zod par domaine métier (Flight complet et testé ; Activity/TrainingCamp/GroundHandlingSession en structure seule pour l'instant)
  - `src/features/` : couche métier par feature (ex. `flights/create-flight.service.ts`), indépendante de l'UI
  - `src/actions/` : Server Actions Next.js
  - `src/app/flights/new` : page de test manuelle du flux de création d'un vol

Base de données : PostgreSQL (local via Docker), Prisma ORM. Validation : Zod. Pas encore d'authentification (Auth.js prévu, non démarré) — un utilisateur de développement est créé par le seed.

Voir [docs/todo.md](./docs/todo.md) pour le détail de l'avancement.
