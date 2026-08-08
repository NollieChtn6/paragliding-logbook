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

- [x] Architecture de validations Zod par domaine (`src/lib/validations/`) — schéma `Flight` complet et testé (tests unitaires) ; `Activity`/`TrainingCamp`/`GroundHandlingSession` en structure seule, sans règle pour l'instant
- [x] Service métier `createFlight` organisé par feature (`src/features/flights/`), indépendant de l'UI — validation + transaction Prisma Activity/Flight, testé en intégration contre une vraie base
- [x] Hash des mots de passe avec Argon2, y compris pour l'utilisateur de développement créé par le seed (jamais de mot de passe en clair en base)
- [x] `getCurrentUser()` (`src/lib/current-user.ts`) : point unique de résolution de l'utilisateur courant, à remplacer par une vraie session le jour où Auth.js sera en place

#### Gestion des activités

- [x] Créer le concept d'activité (`Activity` + `ActivityType`)
- [x] Permettre l'ajout d'une activité — page `/activities/new`, choix du type (Vol/Stage/Gonflage) via `RadioGroup`, formulaire réellement disponible pour Vol uniquement (Stage/Gonflage affichent "Bientôt disponible"), sans authentification (utilisateur de développement créé par le seed)
- [x] Permettre de choisir un type d'activité
- [x] Consultation des activités : page `/activities` (historique trié par date d'événement, du plus récent au plus ancien) et `/activities/[id]` (détail complet), lecture via `src/features/activities/` (`listActivities`, `getActivityById`), gestion propre du cas "activité introuvable"

---

### À venir 📌

### Authentification

- [ ] Choisir et configurer la solution d'authentification
- [ ] Créer le modèle utilisateur
- [ ] Préparer la gestion multi-utilisateurs

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

- [x] Ajouter un vol — `/activities/new` (flux officiel) et `/flights/new` (route de test historique, même formulaire partagé), sans authentification
- [ ] Modifier un vol
- [x] Consulter l'historique des vols — `/activities` (liste) et `/activities/[id]` (détail)
- [ ] Associer un vol à un stage (`trainingCampId` prévu au schéma, non exposé dans le formulaire)

---

## Rappels importants sur les notions

### Stages 🎓

Informations prévues :

- [ ] Date de début
- [ ] Date de fin
- [ ] École
- [ ] Type de stage / niveau
- [ ] Bilan
- [ ] Nombre de vols réalisés
- [ ] Certification obtenue

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
