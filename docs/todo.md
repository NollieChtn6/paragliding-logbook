# THERMIK — Backlog

## Vision

Créer un carnet de vol numérique personnel permettant de suivre sa progression en parapente :

- enregistrer ses activités (vols, stages, gonflages) ;
- conserver ses observations et axes d'amélioration ;
- visualiser sa progression dans le temps ;
- construire un historique personnel de pratique.

---

## Avancement du projet

### Terminé ✅

#### Socle technique

- [x] Initialiser le repository GitHub
- [x] Configurer le monorepo pnpm
- [x] Configurer TypeScript
- [x] Configurer Biome (lint/format)
- [x] Configurer Vitest
- [x] Configurer Husky et lint-staged
- [x] Configurer GitHub Actions CI
- [x] Protéger les branches `main` et `develop`
- [x] Configurer le workflow branches / commits / pull requests

#### Application web

- [x] Initialiser l'application Next.js
- [x] Configurer TypeScript strict
- [x] Configurer Tailwind CSS
- [x] Initialiser shadcn/ui
- [x] Remplacer le boilerplate Next.js par un shell applicatif minimal
- [x] Préparer une interface mobile-first

#### Base de données

- [x] Configurer PostgreSQL en local
- [x] Configurer Prisma
- [x] Créer le premier schéma de données
- [x] Créer les migrations initiales
- [x] Ajouter les données de référence (`ActivityType`)

#### Validation et couche métier

- [x] Architecture de validations Zod par domaine (`src/lib/validations/`) — schémas `Flight`, `TrainingCamp` et `GroundHandlingSession` complets et testés (tests unitaires) ; `Activity` en structure seule, sans règle pour l'instant
- [x] Service métier `createFlight` organisé par feature (`src/features/flights/`), indépendant de l'UI — validation + transaction Prisma Activity/Flight, testé en intégration contre une vraie base
- [x] Service métier `createTrainingCamp` (`src/features/training-camps/`), même structure que `createFlight` — validation + transaction Prisma Activity/TrainingCamp, testé en intégration
- [x] Service métier `createGroundHandlingSession` (`src/features/ground-handling-sessions/`), même structure que `createFlight`/`createTrainingCamp` — validation + transaction Prisma Activity/GroundHandlingSession, testé en intégration
- [x] Hash des mots de passe avec Argon2 (`src/lib/password.ts`)
- [x] `getCurrentUser()` (`src/lib/current-user.ts`) : résolution de l'utilisateur courant à partir de la vraie session Better Auth

#### Gestion des activités

- [x] Créer le concept d'activité (`Activity` + `ActivityType`)
- [x] Permettre l'ajout d'une activité — page `/activities/new`, choix du type (Vol/Stage/Gonflage) via `RadioGroup`, formulaire disponible pour les trois types du MVP, route protégée (connexion requise)
- [x] Permettre de choisir un type d'activité
- [x] Consultation des activités : page `/activities` (historique trié par date d'événement, du plus récent au plus ancien) et `/activities/[id]` (détail complet), lecture via `src/features/activities/` (`listActivities`, `getActivityById`), gestion propre du cas "activité introuvable", routes protégées (connexion requise)

#### Authentification

- [x] Choisir et configurer la solution d'authentification — Better Auth (email + mot de passe, hash Argon2, adaptateur Prisma)
- [x] Créer le modèle utilisateur — `User` + modèles Better Auth (`Session`, `Account`, `Verification`)
- [x] Préparer la gestion multi-utilisateurs — chaque donnée métier reste liée à un `userId` résolu côté serveur depuis la session
- [x] Page de connexion `/sign-in` (email + mot de passe, pas d'inscription publique — comptes créés par le seed), avec retour vers la page initialement demandée (`redirectTo`, validé contre les open redirects)
- [x] Protection des routes (`/activities`, `/activities/new`, `/activities/[id]`, `/flights/new`) : vérification optimiste dans `src/proxy.ts`, vérification faisant autorité via `requireCurrentUser()`
- [x] `User.passwordHash` retiré : le hash Argon2 vit uniquement sur `Account.password` (Better Auth)

---

### À venir 📌

### Authentification (backlog restreint)

- [ ] Inscription publique (`/sign-up`) — volontairement hors MVP pour l'instant, comptes créés de manière contrôlée
- [ ] Réinitialisation de mot de passe

### Gestion des activités

Types prévus :

- Vol
- Stage
- Gonflage

---

## Vols 🪂

Informations obligatoires (validées côté Zod) :

- [x] Date
- [x] Point de départ (site + altitude dérivés du `SitePoint` choisi)
- [x] Point d'arrivée (site + altitude dérivés du `SitePoint` choisi, potentiellement un site différent)
- [x] Durée
- [x] Type de vol
- [x] Observations
- [x] Points d'amélioration

Fonctionnalités :

- [x] Ajouter un vol — `/activities/new` (flux officiel) et `/flights/new` (route de test historique, même formulaire partagé), routes protégées (connexion requise)
- [x] Modifier un vol — `/activities/[id]/edit`, service `updateFlight` (`src/features/flights/`), même règle métier "date dans l'intervalle du stage" qu'à la création, vérification de propriété systématique
- [x] Supprimer un vol — bouton "Supprimer" + confirmation sur `/activities/[id]`, service générique `deleteActivity` (`src/features/activities/`, commun aux trois types d'activité)
- [x] Modèle Site/SitePoint/SitePointType — un vol référence un point de départ et un point d'arrivée (`SitePoint`), plutôt qu'un site unique avec des altitudes dupliquées ; plus de règle comparant les altitudes de décollage/atterrissage (départ et arrivée peuvent appartenir à des sites différents, ex. cross)
- [x] Consulter l'historique des vols — `/activities` (liste) et `/activities/[id]` (détail)
- [x] Associer un vol à un stage à la création — champ optionnel "Stage associé" dans `FlightForm` (limité aux stages de l'utilisateur courant, `listTrainingCamps`), règle métier "date du vol dans l'intervalle du stage" validée et testée dans `create-flight.service.ts`

---

## Stages 🎓

Informations obligatoires (validées côté Zod) :

- [x] Date de début
- [x] Date de fin (`startDate <= endDate`)
- [x] École
- [x] Type de stage
- [x] Bilan (optionnel)
- [x] Certification obtenue (optionnelle)

Fonctionnalités :

- [x] Ajouter un stage — `/activities/new`, service `createTrainingCamp` (`src/features/training-camps/`), route protégée (connexion requise)
- [x] Consulter l'historique des stages — `/activities` (liste) et `/activities/[id]` (détail)
- [x] Afficher les vols associés à un stage sur `/activities/[id]`, quand il y en a
- [x] Modifier un stage — `/activities/[id]/edit`, service `updateTrainingCamp` (`src/features/training-camps/`), vérification de propriété systématique
- [x] Supprimer un stage — même bouton/service générique `deleteActivity` que les autres types ; les vols/séances éventuellement rattachés au stage sont conservés mais dissociés (`trainingCampId` mis à `null`, contrainte `ON DELETE SET NULL`), pas supprimés — avertissement affiché dans la confirmation si le stage a des enfants
- [ ] Rattacher un vol existant à un stage depuis l'interface

---

## Séances de gonflage 🪁

Informations obligatoires (validées côté Zod) :

- [x] Date
- [x] Site
- [x] Durée (strictement positive)
- [x] Exercices travaillés
- [x] Difficultés rencontrées (optionnel)
- [x] Ressenti (optionnel)

Fonctionnalités :

- [x] Ajouter une séance — `/activities/new`, service `createGroundHandlingSession` (`src/features/ground-handling-sessions/`), route protégée (connexion requise)
- [x] Consulter l'historique des séances — `/activities` (liste) et `/activities/[id]` (détail)
- [x] Associer une séance à un stage à la création — champ optionnel "Stage associé" dans `GroundHandlingSessionForm` (limité aux stages de l'utilisateur courant), règle métier "date de la séance dans l'intervalle du stage" validée et testée dans `create-ground-handling-session.service.ts` ; séances associées affichées sur le détail du stage
- [x] Modifier une séance — `/activities/[id]/edit`, service `updateGroundHandlingSession` (`src/features/ground-handling-sessions/`), même règle métier "date dans l'intervalle du stage" qu'à la création, vérification de propriété systématique
- [x] Supprimer une séance — même bouton/service générique `deleteActivity` que les autres types

---

## Dashboard 📊

Page d'accueil (`/`), route protégée (connexion requise), remplace l'ancienne page publique.

Statistiques affichées (`src/features/dashboard/`, dérivées en mémoire du résultat de `listActivities` — aucune requête Prisma supplémentaire) :

- [x] Nombre total de vols
- [x] Temps de vol cumulé
- [x] Temps moyen par vol
- [x] Nombre de séances de gonflage
- [x] Temps de gonflage cumulé
- [x] Nombre total d'activités

Fonctionnalités :

- [x] Cartes de statistiques (shadcn `Card`), empilées sur mobile, grille simple sur desktop
- [x] 5 activités les plus récentes, avec lien vers l'historique complet
- [x] Bouton principal "Ajouter une activité"

---

## Rappels importants sur les notions

### Sites de vol 🌍

- [x] Modèle `Site`/`SitePoint`/`SitePointType` — un site peut avoir plusieurs points (décollage, atterrissage), chacun avec coordonnées GPS précises et altitude ; `Site.primaryTakeoffPointId`/`primaryLandingPointId` désignent le point principal
- [x] `Site.countryCode`/`School` enrichi (adresse structurée, code pays ISO) — prépare `School`/`Site`/`SitePoint` à une future gestion applicative sans construire l'interface (ADR 004, `docs/decisions/004-editable-referentials.md`)
- [ ] Créer la gestion des sites de vol (interface de création/modification d'un `Site` et de ses `SitePoint` — actuellement seedés uniquement)
- [ ] Ajouter un site manuellement
- [ ] Prévoir une évolution vers des données externes (API)

Informations prévues :

- Nom
- Localisation
- Altitude
- Informations complémentaires

### Statistiques avancées 📊

Hors périmètre du dashboard actuel (pas de filtrage avancé, pas de graphiques).

- [ ] Progression dans le temps
- [ ] Statistiques par site
- [ ] Statistiques par type d'activité

---

## Idées futures 💡

Ces fonctionnalités sont volontairement hors MVP.

- [ ] Import de traces GPS / fichiers IGC
- [ ] Carte des sites visités
- [ ] Météo associée aux vols
- [ ] Gestion du matériel
- [ ] Photos associées aux activités
- [ ] Carnet de progression / objectifs personnels
- [ ] Suggestions d'amélioration basées sur l'historique
- [ ] Mode PWA / application mobile installable

---

## MVP

Le premier objectif fonctionnel est :

1. Créer un compte utilisateur
2. Ajouter une activité
3. Choisir le type :
   - Vol
   - Stage
   - Gonflage
4. Enregistrer les informations essentielles
5. Consulter son historique
6. Voir quelques statistiques simples
