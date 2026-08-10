# Administration (`/admin`)

## Rôles

`UserRole` (`schema.prisma`) : `USER` (défaut) ou `ADMIN`.

USER par défaut, ADMIN attribué uniquement en base — aucune interface ne permet de choisir ou de changer son propre rôle. `/sign-up` attribue toujours `USER` (vérifié par `features/auth/sign-up-role.integration.test.ts`). Le seul moyen d'obtenir un compte ADMIN est le script de seed (`prisma/seed.ts` > `ensureAdminUser`), qui ne s'exécute que si la variable d'environnement `ADMIN_PASSWORD` est définie — voir `.env.example`. En son absence (notamment en production tant qu'aucun admin n'a été explicitement configuré), le seed des référentiels s'exécute normalement mais saute la création du compte admin.

Un utilisateur ADMIN ne voit jamais l'application principale : `app/(app)/layout.tsx` le redirige systématiquement vers `/admin`.

Gestion des utilisateurs par un admin (liste, changement de rôle depuis l'interface) : volontairement hors périmètre (voir `docs/todo.md`).

---

## Protection de `/admin`

Deux niveaux, jamais un seul :

1. **`proxy.ts`** — vérification optimiste (présence du cookie de session uniquement, pas de lecture DB) pour rediriger tôt vers `/sign-in`. Non fait autorité.
2. **`requireAdmin()`** (`src/lib/current-user.ts`) — vérification qui fait autorité, relit la session en base et vérifie `role === "ADMIN"`. Appelée dans `app/admin/layout.tsx` (protège les pages) **et** individuellement dans chaque Server Action de mutation (`actions/create-site.ts`, `update-site.ts`, `delete-site.ts`, et les équivalents `site-point`/`school`) : le layout ne protège que le rendu des pages, jamais les mutations, donc chaque action revérifie par elle-même.

Un utilisateur non-ADMIN qui atteint `/admin` est silencieusement ramené à `/` (`requireAdmin()`), pas de page "accès refusé" dédiée pour ce périmètre initial.

---

## Périmètre

Trois référentiels partagés (pas de `userId`, ce sont des données du monde réel — voir `docs/decisions/004-editable-referentials.md`), CRUD complet pour chacun :

- **Sites** (`/admin/sites`)
- **Points de site** (`/admin/site-points`) — décollage ou atterrissage, rattachés à un site
- **Écoles** (`/admin/schools`)

Les tables de référence techniques (`ActivityType`, `FlightType`, `TrainingCampType`, `SitePointType`) ne sont **pas** gérables depuis `/admin` : elles restent seedées/migrées (voir `docs/decisions/003-reference-table-codes.md`), volontairement hors périmètre de cette première version.

### Gestion des sites

Consulter, créer, modifier, supprimer un site (nom, région, code pays, coordonnées). Un site liste ses points associés sur sa page d'édition.

### Gestion des points de site

Recherche + filtres combinables (nom, site, type — `list-site-points.service.ts`). Le type d'un point (TAKEOFF/LANDING) doit provenir du référentiel `SitePointType`, jamais saisi librement. À la création, le site et le type doivent exister (vérifié explicitement, message clair plutôt qu'une violation de contrainte FK brute — `create-site-point.service.ts`).

### Gestion des écoles

Consulter, créer, modifier, supprimer une école (nom, adresse structurée, code pays, site web).

---

## Suppression

Jamais de suppression en cascade silencieuse. Chaque service de suppression vérifie d'abord si l'entité est encore référencée, et lève une `ReferenceDataInUseError` (`lib/reference-data-in-use.error.ts`) avec un message explicite plutôt que d'entraîner une perte de données utilisateur :

- **Site** : bloqué si des `SitePoint` ou des `GroundHandlingSession` y sont encore rattachés (protège transitivement les `Flight`, référencés via `SitePoint` et jamais directement via `Site`).
- **SitePoint** : bloqué si un `Flight` l'utilise encore comme décollage ou atterrissage.
- **School** : bloqué si un `TrainingCamp` y est encore rattaché.

Toute suppression depuis l'UI passe par une confirmation explicite (`AlertDialog`, `components/admin/admin-delete-button.tsx`) — jamais de suppression instantanée.

---

## Interface, navigation

`AdminShell` (`components/admin/admin-shell.tsx`) : chrome dédié à `/admin`, séparé de l'`AppShell` de l'application principale. Navigation propre (`ADMIN_NAV_ITEMS`, `components/admin/admin-nav-items.ts`) : Tableau de bord, Sites, Points, Écoles.

Le tableau de bord (`app/admin/page.tsx`) n'affiche que des compteurs simples (`site.count()`, `sitePoint.count()`, `school.count()`) — pas de statistiques complexes, pas de service dédié pour trois `count()`.

---

## Helpers d'autorisation

Point d'entrée unique pour la vérification de session/rôle, plutôt que des `if (user.role === "ADMIN")` dispersés (`src/lib/current-user.ts`) :

- `getCurrentUser()` — session courante ou `null`.
- `requireCurrentUser()` — redirige vers `/sign-in` si absente. Fait autorité (contrairement à `proxy.ts`).
- `requireAdmin()` — appelle `requireCurrentUser()` puis vérifie `role === "ADMIN"`, redirige vers `/` sinon.
