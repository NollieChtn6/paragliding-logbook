# paragliding-logbook

Carnet de bord personnel de parapente (vols, stages, gonflages, statistiques).

Voir [CLAUDE.md](./CLAUDE.md) pour le contexte projet, la stack technique et les conventions.

## Prérequis

- Node.js >= 22
- pnpm 10 (`packageManager` défini dans `package.json`)

## Installation

```bash
pnpm install
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
| `pnpm test` | Exécute les tests avec Vitest |

## Qualité de code

- **Biome** : lint + format (voir `biome.json`)
- **Husky** + **lint-staged** : vérifications automatiques avant chaque commit
- **GitHub Actions** (`.github/workflows/ci.yml`) : install, lint, typecheck, test sur chaque push/PR vers `main` et `develop`

## Structure

Monorepo pnpm workspaces (`apps/*`, `packages/*`) :

- `apps/web` : application Next.js (App Router, TypeScript strict, Tailwind CSS, shadcn/ui)

Phase actuelle : scaffold Next.js. Aucune fonctionnalité métier (vols, stages, gonflages) n'est encore implémentée.
