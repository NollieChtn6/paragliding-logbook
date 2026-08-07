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

---

### En cours 🚧

#### Base de données

Objectif : disposer du socle de données permettant de gérer les activités.

- [ ] Configurer PostgreSQL en local
- [ ] Configurer Prisma
- [ ] Créer le premier schéma de données
- [ ] Créer les migrations initiales
- [ ] Ajouter les données de référence (`ActivityType`)

---

### À venir 📌

### Authentification

- [ ] Choisir et configurer la solution d'authentification
- [ ] Créer le modèle utilisateur
- [ ] Préparer la gestion multi-utilisateurs

### Gestion des activités

#### Activité générique

- [ ] Créer le concept d'activité
- [ ] Permettre l'ajout d'une activité
- [ ] Permettre de choisir un type d'activité

Types prévus :

- Vol
- Stage
- Gonflage

---

## Vols 🪂

Informations obligatoires :

- [ ] Date
- [ ] Site
- [ ] Altitude de décollage
- [ ] Altitude d'atterrissage
- [ ] Durée
- [ ] Type de vol
- [ ] Observations
- [ ] Points d'amélioration

Fonctionnalités :

- [ ] Ajouter un vol
- [ ] Modifier un vol
- [ ] Consulter l'historique des vols
- [ ] Associer un vol à un stage

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

## #Séances de gonflage

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
