# CLAUDE.md

## Projet

Nom : paragliding-logbook

Application web mobile-first permettant de gérer un carnet de bord personnel de parapente.

L'objectif est de suivre la progression sportive à travers :

- les vols,
- les stages,
- les séances de gonflage,
- les statistiques de pratique.

L'application doit rester simple, agréable à utiliser au quotidien et évoluer progressivement à partir des besoins réels.

---

## Principes de développement

### Priorités

Toujours privilégier :

1. La simplicité
2. La maintenabilité
3. La qualité du code
4. L'expérience utilisateur
5. La livraison progressive

Éviter :

- la sur-ingénierie,
- les abstractions inutiles,
- les fonctionnalités non demandées.

---

## Règle fondamentale

Ne jamais développer une fonctionnalité du backlog futur sans demande explicite.

Le backlog contient des idées potentielles mais ne fait pas partie du périmètre courant.

---

## Stack technique

### Monorepo

- pnpm workspaces

### Application

- Next.js App Router
- React
- TypeScript strict

### UI

- Tailwind CSS
- shadcn/ui

Tous les formulaires doivent utiliser exclusivement les composants shadcn/ui.
Ne pas utiliser directement les éléments HTML input/select/button sauf justification.
Les styles doivent être cohérents Firefox, Safari et Chromium.

### Backend

API intégrée Next.js

### Base de données

- PostgreSQL
- Prisma ORM

### Authentification

- Better Auth
- Email + mot de passe
- Hash sécurisé des mots de passe avec Argon2
- Pas d'inscription publique dans le MVP (`/sign-in` uniquement) : comptes créés de manière contrôlée

Better Auth plutôt qu'Auth.js : Auth.js est passé en mode maintenance (son
équipe est désormais celle de Better Auth, qui recommande Better Auth pour les
nouveaux projets), et Better Auth est compatible avec Next.js App Router et
Prisma 7 via un adaptateur dédié.

### Validation

- Zod

### Tests

- Vitest

### Qualité

- Biome
- Husky
- lint-staged

### CI

GitHub Actions doit exécuter :

- installation dépendances
- lint
- typecheck
- tests

---

## Architecture

L'application doit être pensée comme une application multi-utilisateurs.

Même si l'usage initial est personnel :

- chaque donnée métier doit être liée à un utilisateur,
- aucune donnée ne doit être globale sans justification.

### Conventions de sécurité

Le `userId` ne doit jamais être une donnée envoyée ou fiable côté client
(champ de formulaire caché, prop, paramètre d'URL, etc.). Il doit toujours
être résolu côté serveur à partir de la session (Better Auth), jamais fourni
par le client.

---

## Domaine métier

### Activités

Le concept central est Activity.

Une activité peut être :

- VOL
- STAGE
- GONFLAGE

Les activités doivent permettre :

- une timeline chronologique,
- des statistiques,
- une évolution future.

---

### Vol

Informations obligatoires :

- date
- point de départ (site + altitude dérivés du point choisi)
- point d'arrivée (site + altitude dérivés du point choisi — peut appartenir à un site différent du départ, ex. vol de cross)
- durée
- type de vol
- observations
- points d'amélioration

Un site peut avoir plusieurs points (décollage, atterrissage), avec coordonnées GPS et altitude. Aucune contrainte ne compare les altitudes de départ et d'arrivée.

Type de vol :

- LOCAL
- CROSS
- SOARING
- THERMAL
- TRAINING
- OTHER

Informations futures :

- météo
- matériel
- trace IGC
- analyse GPS

---

### Stage

Informations :

- date début
- date fin
- école
- type de stage
- bilan
- certification éventuelle

Un stage peut contenir plusieurs vols.

---

### Gonflage

Informations :

- date
- site
- durée
- exercices travaillés

Informations futures :

- difficultés
- ressenti détaillé

---

## Workflow attendu pour chaque fonctionnalité

Avant d'implémenter :

1. Comprendre le besoin utilisateur
2. Vérifier l'impact sur le modèle de données
3. Proposer une approche
4. Identifier les fichiers impactés
5. Implémenter
6. Ajouter ou modifier les tests
7. Mettre à jour la documentation
8. Ne pas effectuer de commits automatiquement

---

## Conventions Git

Les commits doivent être explicites.

Préférer :

feat:
fix:
refactor:
test:
docs:
chore:

Exemple :

feat: add flight creation form

---

## Code

Toujours :

- TypeScript strict
- fonctions courtes
- noms explicites
- éviter any
- documenter les choix complexes
- commenter au maximul

---

## Git workflow

### Branches principales

- main : branche de production
- develop : branche d'intégration/test

La branche main doit toujours être stable et déployable.

La branche develop sert à valider les fonctionnalités avant passage en production.

---

### Branches de travail

Toute évolution doit être développée dans une branche dédiée.

Convention :

feat/<nom-fonctionnalite>
fix/<nom-correction>
refactor/<nom-sujet>
chore/<nom-tache>

Exemples :

feat/add-flight-form
fix/auth-session-expiration
chore/setup-prisma

---

### Workflow

1. Partir de develop
2. Créer une branche de travail
3. Développer
4. Vérifier :
   - lint
   - typecheck
   - tests
5. Fusionner dans develop
6. Valider
7. Fusionner develop dans main pour production

Ne jamais travailler directement sur main ou develop.

---

### Commit convention

Le projet suit Conventional Commits.

Exemples :

feat(auth): add login page

feat(flight): add flight creation API

fix(activity): validate activity type

test(prisma): add activity repository tests

chore(ci): configure github actions

#### Claude Code workflow

Avant de créer un commit :

1. Vérifier les fichiers modifiés.

2. Vérifier que les tests passent.

3. Proposer un message Conventional Commit adapté.

4. Attendre validation utilisateur avant commit.

### Git authorship

Les commits doivent être attribués à l'utilisateur du repository.

Ne jamais :

- ajouter Claude comme auteur,

- ajouter de trailer mentionnant Claude,

- ajouter de signature automatique indiquant l'utilisation d'une IA,

- utiliser "Co-authored-by: Claude" ou équivalent.

Les messages de commit doivent suivre uniquement la convention Conventional Commits définie dans ce document.

Avant de créer un commit :

- vérifier l'identité Git configurée,

- proposer le message de commit,

- attendre validation utilisateur.

---

## Backlog futur (ne pas implémenter sans demande)

- import IGC
- analyse GPS
- cartes interactives
- météo automatique
- récupération des sites de vol
- récupération des écoles FFVL
- gestion du matériel
- voile
- sellette
- statistiques avancées
- export PDF
- PWA
- notifications
