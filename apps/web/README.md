# web

Application Next.js (App Router) de paragliding-logbook.

Voir le [README racine](../../README.md) pour les prérequis et les scripts du monorepo. Depuis la racine :

```bash
pnpm dev   # équivaut à pnpm --filter web dev
```

## Base de données

Nécessite `apps/web/.env` (copié depuis `.env.example`) et PostgreSQL local démarré (`docker compose up -d` depuis la racine). Puis `pnpm prisma:migrate` et `pnpm prisma:seed`.

## Routes de test

- `/flights/new` : formulaire minimal permettant de créer un vol réel en base (pas d'authentification, utilisateur de développement créé par le seed).
