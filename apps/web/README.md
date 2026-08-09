# web

Application Next.js (App Router) de paragliding-logbook.

Voir le [README racine](../../README.md) pour les prérequis et les scripts du monorepo. Depuis la racine :

```bash
pnpm dev   # équivaut à pnpm --filter web dev
```

## Base de données

Nécessite `apps/web/.env` (copié depuis `.env.example`) et PostgreSQL local démarré (`docker compose up -d` depuis la racine). Puis `pnpm prisma:migrate` et `pnpm prisma:seed`.

## Routes

- `/` : dashboard — cartes de statistiques (vols, gonflage, total d'activités) et 5 activités les plus récentes, lecture via `src/features/dashboard/`. **Protégée.**
- `/sign-in` : connexion email + mot de passe (pas d'inscription publique — comptes créés par le seed). Accepte un paramètre `redirectTo` (validé côté serveur contre les open redirects) pour revenir à la page initialement demandée après connexion.
- `/activities` : historique des activités de l'utilisateur, triées de la plus récente à la plus ancienne. **Protégée.**
- `/activities/[id]` : détail d'une activité (page "introuvable" dédiée si elle n'existe pas ou n'appartient pas à l'utilisateur), avec suppression (bouton "Supprimer" + confirmation) via `src/actions/delete-activity.ts` — supprime l'`Activity`, sa spécialisation (Flight/TrainingCamp/GroundHandlingSession) est supprimée en cascade par la base ; un vol/une séance rattaché à un stage supprimé est conservé mais dissocié du stage. **Protégée.**
- `/activities/[id]/edit` : modification d'une activité — type déterminé automatiquement (Vol/Stage/Gonflage), formulaire pré-rempli (même composant partagé qu'à la création), vérification systématique que l'activité appartient à l'utilisateur courant. **Protégée.**
- `/activities/new` : choix du type d'activité (Vol/Stage/Gonflage) puis formulaire — les trois types du MVP sont implémentés. **Protégée.**
- `/flights/new` : route de test historique, formulaire de vol seul (même composant partagé que `/activities/new`). **Protégée.**

Routes protégées : accès sans session valide → redirection vers `/sign-in?redirectTo=<page demandée>` (vérification optimiste dans `src/proxy.ts`, vérification faisant autorité via `requireCurrentUser()` dans la page ou la Server Action elle-même).

Les pages protégées vivent physiquement sous `src/app/(app)/` (route group : n'affecte pas les URLs ci-dessus) pour partager le même `AppShell` (`src/components/layout/`) sans dupliquer son rendu dans chaque page.

## UI

Direction visuelle détaillée dans [`docs/ui-directions.md`](../../docs/ui-directions.md).

- Navigation responsive : `DesktopSidebar` (≥ md) / `MobileBottomNav` (< md), toutes deux dérivées de `src/components/layout/nav-items.ts`.
- Thème clair/sombre via `next-themes` (`attribute="class"`, défaut système) — bascule manuelle dans `ThemeToggle`.
- Police Plus Jakarta Sans (SIL OFL) auto-hébergée via `next/font/local` (`src/app/fonts/`) — pas de dépendance à Google Fonts.
- Composants de présentation réutilisables : `StatCard`, `ActivityCard`, `EmptyState` (`src/components/`).
