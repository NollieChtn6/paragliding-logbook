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
| `pnpm lint` | Vérifie le code avec Biome |
| `pnpm lint:fix` | Corrige automatiquement ce qui peut l'être |
| `pnpm format` | Formate le code avec Biome |
| `pnpm typecheck` | Vérifie les types TypeScript (`tsc --noEmit`) |
| `pnpm test` | Exécute les tests avec Vitest |

## Qualité de code

- **Biome** : lint + format (voir `biome.json`)
- **Husky** + **lint-staged** : vérifications automatiques avant chaque commit
- **GitHub Actions** (`.github/workflows/ci.yml`) : install, lint, typecheck, test sur chaque push/PR vers `main` et `develop`

## Structure

Monorepo pnpm workspaces (`apps/*`, `packages/*`). Actuellement en phase bootstrap : seuls les outils de qualité et d'intégration continue sont configurés, aucune application n'est encore présente.
