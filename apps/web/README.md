# web

Application Next.js (App Router) de paragliding-logbook.

Voir le [README racine](../../README.md) pour les prérequis et les scripts du monorepo. Depuis la racine :

```bash
pnpm dev   # équivaut à pnpm --filter web dev
```

## Base de données

Nécessite `apps/web/.env` (copié depuis `.env.example`) et PostgreSQL local démarré (`docker compose up -d` depuis la racine). Puis `pnpm prisma:migrate` et `pnpm prisma:seed`.

## Routes

- `/activities` : historique des activités de l'utilisateur, triées de la plus récente à la plus ancienne.
- `/activities/[id]` : détail d'une activité (page "introuvable" dédiée si elle n'existe pas ou n'appartient pas à l'utilisateur).
- `/activities/new` : choix du type d'activité (Vol/Stage/Gonflage) puis formulaire — seul Vol est implémenté, les deux autres affichent "Bientôt disponible".
- `/flights/new` : route de test historique, formulaire de vol seul (même composant partagé que `/activities/new`).

Aucune authentification : ces routes utilisent l'utilisateur de développement créé par le seed.
