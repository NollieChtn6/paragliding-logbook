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

## Mises à jour post-implémentation

### `GITHUB_TOKEN` ne déclenche pas d'autres workflows

Constaté à l'usage : les deux premières Release PR (#64, #66) n'ont jamais fait tourner `Quality checks` (status check obligatoire pour merger) — GitHub bloque volontairement qu'un push/une PR créés par le `GITHUB_TOKEN` par défaut d'un workflow en déclenchent un autre (protection anti-boucle infinie). `release.yml` utilise donc un Personal Access Token (`secrets.RELEASE_PLEASE_TOKEN`, fine-grained, scopé à ce repo, `Contents`/`Pull requests: Read and write`) à la place — les Release PR se comportent alors comme des PR humaines.

### `develop` ne reçoit jamais le bump de version tout seul

`release-please` ne modifie que `main` (là où il tourne). `develop` ne reçoit jamais `package.json`/`CHANGELOG.md`/`.release-please-manifest.json` automatiquement : sans action, il faut une resynchronisation manuelle (merge `main → develop`) après chaque release, exactement le genre d'étape manuelle oubliable que ce système devait éviter.

Ajout d'un second job (`sync-develop`) dans `release.yml`, déclenché uniquement quand `release-please` vient de publier une release (`needs.release-please.outputs.release_created`). Il merge `main` dans `develop` et ouvre/auto-merge une PR — avec le même PAT, pour que cette PR aussi déclenche `Quality checks` normalement. `--merge` (jamais squash/rebase) : un squash romprait l'ascendance partagée entre `develop` et `main`, recréant le problème que ce job existe pour éviter — voir plus haut, ce lien s'est cassé au moins deux fois avant ce correctif (PR #57/#59, puis #65) suite à des Release PR ou promotions `develop → main` mergées en squash.

Note technique : en mode manifest (`packages: {...}` dans `.release-please-config.json`, même avec un seul package), les outputs de `release-please-action` sont préfixés par le chemin du package (`apps/web--release_created`, pas `release_created` à plat) — vérifié dans la documentation de l'action avant implémentation, cette confusion est une source d'échec silencieux courante (la condition `if` ne serait simplement jamais vraie).

Dépendances externes à ce correctif, à vérifier si `sync-develop` ne se déclenche pas comme attendu :

- le secret `RELEASE_PLEASE_TOKEN` doit exister sur le repo (fine-grained PAT, `Contents`/`Pull requests: Read and write`, scopé à ce repo) ;
- "Allow auto-merge" doit être activé (Settings → General → Pull Requests) — `gh pr merge --auto` s'appuie dessus ;
- la règle "Require linear history" doit rester désactivée sur `develop` (sinon `--merge` échoue, seuls squash/rebase seraient permis, ce qui recasserait l'ascendance partagée).
