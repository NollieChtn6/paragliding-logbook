# web

Application Next.js (App Router) de paragliding-logbook.

Voir le [README racine](../../README.md) pour les prérequis et les scripts du monorepo. Depuis la racine :

```bash
pnpm dev   # équivaut à pnpm --filter web dev
```

## Base de données

Nécessite `apps/web/.env` (copié depuis `.env.example`) et PostgreSQL local démarré (`docker compose up -d` depuis la racine). Puis `pnpm prisma:migrate` et `pnpm prisma:seed`.

## Routes

- `/sign-in` : connexion email + mot de passe (pas d'inscription publique — comptes créés par le seed). Accepte un paramètre `redirectTo` (validé côté serveur contre les open redirects) pour revenir à la page initialement demandée après connexion.
- `/activities` : historique des activités de l'utilisateur, triées de la plus récente à la plus ancienne. **Protégée.**
- `/activities/[id]` : détail d'une activité (page "introuvable" dédiée si elle n'existe pas ou n'appartient pas à l'utilisateur). **Protégée.**
- `/activities/new` : choix du type d'activité (Vol/Stage/Gonflage) puis formulaire — Vol et Stage sont implémentés, Gonflage affiche "Bientôt disponible". **Protégée.**
- `/flights/new` : route de test historique, formulaire de vol seul (même composant partagé que `/activities/new`). **Protégée.**

Routes protégées : accès sans session valide → redirection vers `/sign-in?redirectTo=<page demandée>` (vérification optimiste dans `src/proxy.ts`, vérification faisant autorité via `requireCurrentUser()` dans la page ou la Server Action elle-même).
