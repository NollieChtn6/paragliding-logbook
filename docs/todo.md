# Paragliding Logbook - Backlog

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

- [x] Architecture de validations Zod par domaine (`src/lib/validations/`) — schémas `Flight` et `TrainingCamp` complets et testés (tests unitaires) ; `Activity`/`GroundHandlingSession` en structure seule, sans règle pour l'instant
- [x] Service métier `createFlight` organisé par feature (`src/features/flights/`), indépendant de l'UI — validation + transaction Prisma Activity/Flight, testé en intégration contre une vraie base
- [x] Service métier `createTrainingCamp` (`src/features/training-camps/`), même structure que `createFlight` — validation + transaction Prisma Activity/TrainingCamp, testé en intégration
- [x] Hash des mots de passe avec Argon2 (`src/lib/password.ts`)
- [x] `getCurrentUser()` (`src/lib/current-user.ts`) : résolution de l'utilisateur courant à partir de la vraie session Better Auth

#### Gestion des activités

- [x] Créer le concept d'activité (`Activity` + `ActivityType`)
- [x] Permettre l'ajout d'une activité — page `/activities/new`, choix du type (Vol/Stage/Gonflage) via `RadioGroup`, formulaire disponible pour Vol et Stage (Gonflage affiche "Bientôt disponible"), route protégée (connexion requise)
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
- [x] Site
- [x] Altitude de décollage
- [x] Altitude d'atterrissage
- [x] Durée
- [x] Type de vol
- [x] Observations
- [x] Points d'amélioration

Fonctionnalités :

- [x] Ajouter un vol — `/activities/new` (flux officiel) et `/flights/new` (route de test historique, même formulaire partagé), routes protégées (connexion requise)
- [ ] Modifier un vol
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
- [ ] Modifier un stage
- [ ] Rattacher un vol existant à un stage depuis l'interface

---

## Rappels importants sur les notions

### Séances de gonflage

Informations prévues :

- [ ] Date
- [ ] Durée
- [ ] Exercices travaillés
- [ ] Difficultés rencontrées
- [ ] Ressenti

### Sites de vol 🌍

- [ ] Créer la gestion des sites de vol
- [ ] Ajouter un site manuellement
- [ ] Prévoir une évolution vers des données externes (API)

Informations prévues :

- Nom
- Localisation
- Altitude
- Informations complémentaires

### Statistiques 📊

- [ ] Temps de vol cumulé
- [ ] Nombre de vols
- [ ] Temps de gonflage cumulé
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
