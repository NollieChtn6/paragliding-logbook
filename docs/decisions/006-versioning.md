# ADR 006 - Versionnage sémantique automatisé (release-please)

## Contexte

Aucun système de versionnage n'existait : `apps/web/package.json` portait un `version` figé (`0.1.0`) jamais mis à jour, aucun tag Git n'existait, et rien ne permettait de savoir quelle version de l'application tourne réellement sur un déploiement Vercel donné (voir docs/todo.md > Déploiement). Le workflow de release existe déjà (`feat/*` → PR → `develop` → PR → `main`, branches protégées, PR + status checks obligatoires) : un système de versionnage doit s'y greffer, pas en imposer un nouveau.

## Décision

### SemVer + Conventional Commits + release-please

Le dépôt suit déjà Conventional Commits (`feat:`, `fix:`, `chore:`...). [release-please](https://github.com/googleapis/release-please) (action GitHub officielle Google) exploite cette convention : à chaque push sur `main` (donc à chaque merge `develop → main`), il ouvre/actualise une "Release PR" qui bump `apps/web/package.json` (`patch`/`minor`/`major` selon les commits depuis le dernier tag) et génère `apps/web/CHANGELOG.md`. Merger cette PR (comme n'importe quelle autre, mêmes règles de protection de branche) crée automatiquement le tag Git `vX.Y.Z` et une GitHub Release.

Alternative écartée : `semantic-release`, qui pousse directement sur `main` sans passer par une PR — incompatible avec les règles de protection existantes (PR obligatoire, status checks requis) sans contournement.

Version de démarrage : `v1.0.0`, pas `v0.1.0` — l'application est déjà fonctionnelle en usage réel (carnet de vol utilisable), pas dans une phase 0.x sans garantie de stabilité.

### Configuration

- `.release-please-config.json` / `.release-please-manifest.json` (racine) : un seul package suivi, `apps/web` (`release-type: node`, lit/écrit son `package.json`).
- `.github/workflows/release.yml` : déclenché sur push vers `main` uniquement — jamais sur `develop` ou les branches de feature, un tag ne doit correspondre qu'à un état effectivement déployé en production.

### Exposition de la version dans l'application

`apps/web/src/lib/app-version.ts` importe `package.json` directement (statiquement inliné au build par Next.js, `resolveJsonModule` déjà actif) : source unique, tenue à jour par release-please, pas de variable d'environnement à maintenir à la main pour le numéro de version lui-même.

Le SHA du commit déployé (`VERCEL_GIT_COMMIT_SHA`, fourni par Vercel) est ajouté en complément : utile pour distinguer deux déploiements de `develop` faits entre deux tags (même version affichée, commits différents). Non exposé au client par défaut par Vercel ; ré-exposé explicitement via `next.config.ts` (`NEXT_PUBLIC_APP_COMMIT_SHA`), absent en développement local (pas d'erreur, juste `undefined`).

### Affichage

`components/version-badge.tsx`, partagé entre `DesktopSidebar`, `AdminShell` et `app/settings/layout.tsx` (seul endroit où la version reste visible sur mobile, ce layout n'ayant pas de sidebar) : texte discret (`text-xs text-muted-foreground`), le SHA du commit uniquement en `title` (tooltip au survol, desktop) plutôt qu'affiché en clair — reste lisible sans surcharger l'interface.

## Conséquences

Avantages :

- version et CHANGELOG toujours synchronisés avec les tags Git et les déploiements, sans étape manuelle oubliable ;
- s'intègre au workflow de release existant (aucune nouvelle étape ni contournement des règles de protection de branche) ;
- version visible en un coup d'œil pour tout diagnostic ("quelle version est déployée ?"), sans encombrer l'interface.

Inconvénients :

- une "Release PR" en attente sur `main` tant qu'elle n'est pas mergée (bruit visuel supplémentaire dans la liste des PR, habituel avec release-please) ;
- dépendance à une action GitHub tierce (`googleapis/release-please-action`), pas un outil interne.
