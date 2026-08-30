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
- [x] Toasts de succès (connexion, création, modification, suppression) et d'erreur sur tous les formulaires — `components/ui/toast.tsx` (`@base-ui/react/toast`), `components/toast-listener.tsx` + `lib/toast-redirect.ts` pour afficher un toast après une redirection serveur
- [x] États de chargement — `loading.tsx` (Suspense implicite de Next.js) sur `(app)`, `admin` et `settings`, `components/page-loader.tsx` partagé
- [x] Application installable (PWA) — manifest et icônes générés (`app/manifest.ts`, `app/icon.tsx`, `app/apple-icon.tsx`), service worker minimal écrit à la main avec page de repli hors-ligne (`public/sw.js`, `/offline`), invite d'installation sur le dashboard avec QR code pour récupérer l'app sur son téléphone (`components/pwa/`, ADR 008)

#### Base de données

- [x] Configurer PostgreSQL en local
- [x] Configurer Prisma
- [x] Créer le premier schéma de données
- [x] Créer les migrations initiales
- [x] Ajouter les données de référence techniques (`ActivityType`, `FlightType`, `TrainingCampType`, `SiteType`) — seedées, pas de CRUD applicatif (voir Administration)

#### Validation et couche métier

- [x] Architecture de validations Zod par domaine (`src/lib/validations/`) — schémas `Flight`, `TrainingCamp` et `GroundHandlingSession` complets et testés (tests unitaires) ; `Activity` en structure seule, sans règle pour l'instant
- [x] Service métier `createFlight` organisé par feature (`src/features/flights/`), indépendant de l'UI — validation + transaction Prisma Activity/Flight, testé en intégration contre une vraie base
- [x] Service métier `createTrainingCamp` (`src/features/training-camps/`), même structure que `createFlight` — validation + transaction Prisma Activity/TrainingCamp, testé en intégration
- [x] Service métier `createGroundHandlingSession` (`src/features/ground-handling-sessions/`), même structure que `createFlight`/`createTrainingCamp` — validation + transaction Prisma Activity/GroundHandlingSession, testé en intégration
- [x] Hash des mots de passe avec Argon2 (`src/lib/password.ts`)
- [x] `getCurrentUser()` (`src/lib/current-user.ts`) : résolution de l'utilisateur courant à partir de la vraie session Better Auth
- [x] Messages de validation Zod en français sur tous les champs (`lib/validations/{flight,training-camp,ground-handling}.ts`) — évite qu'un message par défaut de Zod (anglais) remonte jusqu'à l'utilisateur via le toast/texte d'erreur

#### Gestion des activités

- [x] Créer le concept d'activité (`Activity` + `ActivityType`)
- [x] Permettre l'ajout d'une activité — page `/activities/new`, assistant en 3 étapes (1. choix du type Vol/Stage/Gonflage via `RadioGroup`, 2. détails structurés, 3. observations/texte libre selon le type), bouton "Annuler" avec confirmation de perte de données à tout moment, formulaire disponible pour les trois types du MVP, route protégée (connexion requise)
- [x] Permettre de choisir un type d'activité
- [x] Consultation des activités : page `/activities` (historique trié par date d'événement, du plus récent au plus ancien) et `/activities/[id]` (détail complet), lecture via `src/features/activities/` (`listActivities`, `getActivityById`), gestion propre du cas "activité introuvable", routes protégées (connexion requise)

#### Authentification

- [x] Choisir et configurer la solution d'authentification — Better Auth (email + mot de passe, hash Argon2, adaptateur Prisma)
- [x] Créer le modèle utilisateur — `User` + modèles Better Auth (`Session`, `Account`, `Verification`)
- [x] Préparer la gestion multi-utilisateurs — chaque donnée métier reste liée à un `userId` résolu côté serveur depuis la session
- [x] Page de connexion `/sign-in` (email + mot de passe), avec retour vers la page initialement demandée (`redirectTo`, validé contre les open redirects)
- [x] Déconnexion — `signOutAction` (`src/actions/sign-out.ts`), bouton disponible dans `AppShell`/`AdminShell`/`app/settings/layout.tsx`
- [x] Protection des routes (`/activities`, `/activities/new`, `/activities/[id]`, `/flights/new`) : vérification optimiste dans `src/proxy.ts`, vérification faisant autorité via `requireCurrentUser()`
- [x] `User.passwordHash` retiré : le hash Argon2 vit uniquement sur `Account.password` (Better Auth)
- [x] Changement de mot de passe `/settings/security` — service `changePassword` (`src/features/account/`), utilise `auth.api.changePassword` de Better Auth (vérification/hash Argon2 déjà branchés), révoque les autres sessions à chaque changement, testé en intégration contre une vraie base
- [x] Inscription publique `/sign-up` (email + mot de passe) — service `signUp` (`src/features/auth/`), utilise `auth.api.signUpEmail` de Better Auth, connexion automatique après inscription, `redirectTo` transmis entre `/sign-in` et `/sign-up`, comptes de développement retirés du seed (`prisma/seed.ts`)
- [x] Rate limiting sur l'authentification — `rateLimit.customRules` (`src/lib/auth.ts`) cible `/sign-in/email` et `/sign-up/email` (5 req/min), actif en production comme le reste du rate limiter Better Auth
- [x] Protection anti-abus de l'inscription — code d'inscription partagé (`SIGNUP_INVITE_CODE`, `src/lib/signup-invite-code.ts`), saisi sur une étape dédiée de `/sign-up` (InputOTP) avant le formulaire, revérifié côté serveur ; mesure temporaire en attendant un renforcement plus complet (voir email ci-dessous)
- [x] Gestion du profil utilisateur (modifier son nom) — `/settings/security`, service `updateProfile` (`src/features/account/`), utilise `auth.api.updateUser` de Better Auth ; email non modifiable pour l'instant (lié à la vérification d'adresse email, toujours backlog)

#### Administration

- [x] Rôle utilisateur — `User.role` (`UserRole` : `USER`/`ADMIN`, défaut `USER`), attribué uniquement en base (pas d'interface pour l'instant), jamais choisi par l'utilisateur (non exposé à Better Auth, testé)
- [x] Autorisation serveur — `requireAdmin()` (`src/lib/current-user.ts`), utilisateur non admin ramené à `/`, non authentifié redirigé vers `/sign-in` ; revérifiée dans chaque Server Action admin, pas seulement dans le layout de `/admin`
- [x] Espace `/admin` (`src/app/admin/`) — tableau de bord (compteurs spots/sites/écoles), navigation dédiée (desktop : colonne latérale ; mobile : onglets défilants), lien "Administration" affiché uniquement aux admins dans la navigation principale
- [x] Gestion des spots `/admin/spots` — liste, recherche, création, modification, suppression (`src/features/spots/`), suppression bloquée si des sites ou séances de gonflage y sont encore rattachés
- [x] Gestion des sites `/admin/sites` — liste filtrable (recherche, spot, type), création, modification, suppression (`src/features/sites/`), type sélectionné depuis le référentiel `SiteType` (pas de texte libre), suppression bloquée si un vol y est encore rattaché
- [x] Gestion des écoles `/admin/schools` — liste, recherche, création, modification, suppression (`src/features/schools/`), suppression bloquée si des stages y sont encore rattachés
- [x] Référentiels techniques (`ActivityType`, `FlightType`, `TrainingCampType`, `SiteType`) non gérables depuis l'interface admin — restent seedés/migrés, volontairement hors périmètre de cette première version

---

### À venir 📌

### Authentification (backlog restreint)

- [ ] Réinitialisation de mot de passe
- [ ] Vérification d'adresse email
- [ ] OAuth (éventuel)
- [ ] MFA (éventuel)

### Administration (backlog restreint)

Volontairement hors périmètre de la première version de `/admin` (docs/admin.md) :

- [ ] Gestion des utilisateurs par un admin (liste, changement de rôle depuis l'interface)
- [ ] Désactivation d'un compte
- [ ] Suppression d'un compte
- [ ] Permissions plus fines que `USER`/`ADMIN` (ex. `canManageSpots()`, `canManageSchools()`) — à introduire seulement si un vrai besoin apparaît
- [ ] Archivage plutôt que suppression pour les référentiels encore référencés
- [ ] Journal d'audit des modifications administratives
- [ ] CRUD admin sur les référentiels techniques (`ActivityType`, `FlightType`, `TrainingCampType`, `SiteType`) — restent gérés par les seeds/migrations pour l'instant

### Interface & qualité (reste à faire)

- [ ] Vérification systématique du rendu sur Firefox/Safari/Chromium
- [ ] Tests d'intégration bout-en-bout des Server Actions (au-delà des services déjà testés en intégration)
- [ ] Continuer à augmenter la couverture de tests sur les cas limites

---

## Vols 🪂

Informations obligatoires (validées côté Zod) :

- [x] Date
- [x] Point de départ (spot + altitude dérivés du `Site` choisi)
- [x] Point d'arrivée (spot + altitude dérivés du `Site` choisi, potentiellement un spot différent)
- [x] Durée
- [x] Type de vol
- [x] Observations
- [x] Points d'amélioration

Fonctionnalités :

- [x] Ajouter un vol — `/activities/new` (flux officiel, assistant en 3 étapes) et `/flights/new` (route de test historique, même formulaire partagé mais affiché en une seule étape), routes protégées (connexion requise)
- [x] Modifier un vol — `/activities/[id]/edit`, service `updateFlight` (`src/features/flights/`), même règle métier "date dans l'intervalle du stage" qu'à la création, vérification de propriété systématique
- [x] Supprimer un vol — bouton "Supprimer" + confirmation sur `/activities/[id]`, service générique `deleteActivity` (`src/features/activities/`, commun aux trois types d'activité)
- [x] Modèle Spot/Site/SiteType — un vol référence un point de départ et un point d'arrivée (`Site`), plutôt qu'un spot unique avec des altitudes dupliquées ; plus de règle comparant les altitudes de décollage/atterrissage (départ et arrivée peuvent appartenir à des spots différents, ex. cross)
- [x] Consulter l'historique des vols — `/activities` (liste) et `/activities/[id]` (détail)
- [x] Associer un vol à un stage à la création — champ optionnel "Stage associé" dans `FlightForm` (limité aux stages de l'utilisateur courant, `listTrainingCamps`), règle métier "date du vol dans l'intervalle du stage" validée et testée dans `create-flight.service.ts`
- [x] Heure du vol (en plus de la date) — permet d'ordonner plusieurs vols le même jour (`getActivityEventDate`), champ obligatoire combiné à la date en un seul `DateTime`, sans conversion de fuseau horaire

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
- [x] Rattacher un vol existant à un stage depuis l'interface — déjà possible via `/activities/[id]/edit` : `FlightForm` affiche le sélecteur "Stage associé" aussi bien à la modification qu'à la création, et `updateFlight` (`src/features/flights/`) accepte de changer/retirer `trainingCampId` (vérifié via un test d'intégration existant et manuellement)

---

## Séances de gonflage 🪁

Informations obligatoires (validées côté Zod) :

- [x] Date
- [x] Spot
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
- [x] Heure de la séance (en plus de la date) — même principe que pour les vols

---

## Brevets et qualifications 🏅

Informations obligatoires (validées côté Zod) :

- [x] Type de brevet/qualification
- [x] Date d'obtention (ne peut pas être dans le futur)

Informations optionnelles :

- [x] École ayant délivré le brevet
- [x] Stage au cours duquel il a été obtenu (limité aux stages de l'utilisateur courant)
- [x] Notes

Fonctionnalités :

- [x] Modèle `Qualification`/`QualificationType` — rattaché directement à `User`, pas via `Activity` : un brevet n'apparaît pas dans la timeline `/activities` (issue #171)
- [x] Ajouter un brevet — `/qualifications/new`, service `createQualification` (`src/features/qualifications/`), route protégée (connexion requise)
- [x] Consulter la liste de ses brevets — `/qualifications`, triée de la plus récente à la plus ancienne
- [x] Modifier un brevet — `/qualifications/[id]/edit`, service `updateQualification`, vérification de propriété systématique
- [x] Supprimer un brevet — service `deleteQualification` dédié (pas de passage par `deleteActivity`, `Qualification` n'étant pas une spécialisation d'`Activity`)
- [x] Référentiel `QualificationType` alimenté par un seed séparé (`prisma/seed-qualification-types.ts`, `pnpm --filter web prisma:seed:qualification-types`), exécutable indépendamment sur preview et production — pas de CRUD admin pour l'instant
- [x] Accès depuis le menu de compte (`AccountMenu`), pas dans la barre de navigation principale (4 emplacements déjà occupés)
- [x] Raccourci additionnel depuis la page Progression (bouton dans l'en-tête, y compris à vide)
- [x] Ancien champ `TrainingCamp.certification` (texte libre) remplacé par `TrainingCamp.qualificationTypeId`, un select vers `QualificationType` dans le formulaire de stage (`/activities/new`, `/activities/[id]/edit`), affiché de façon résolue (pas en texte brut) sur le détail du stage — champ d'affichage propre au stage, ne crée pas automatiquement de `Qualification` personnelle

---

## Matériel 🎒

Informations obligatoires (validées côté Zod) :

- [x] Catégorie (voile/sellette/secours, `EquipmentType`)
- [x] Marque
- [x] Modèle
- [x] Date d'achat
- [x] État à l'achat (neuf/occasion)

Informations optionnelles :

- [x] Taille — libellé et placeholder adaptés à la catégorie (surface pour une voile, taille S/M/L pour une sellette, plage de poids pour un secours)
- [x] Volume de pratique déjà accumulé avant l'achat

Fonctionnalités :

- [x] Modèle `Equipment`/`EquipmentType` — rattaché directement à `User`, donnée personnelle par pilote (pas un référentiel partagé comme `Spot`/`School`)
- [x] Ajouter un équipement — `/equipment/new`, service `createEquipment` (`src/features/equipment/`), route protégée (connexion requise)
- [x] Consulter la liste de son matériel — `/equipment`, groupée par catégorie (voile/sellette/secours)
- [x] Consulter le détail d'un équipement — `/equipment/[id]`, avec ses statistiques dérivées (nombre de vols, nombre de séances de gonflage, volume de pratique total)
- [x] Modifier un équipement — `/equipment/[id]/edit`, service `updateEquipment`, vérification de propriété systématique
- [x] Supprimer un équipement — service `deleteEquipment` dédié, bloqué (`ReferenceDataInUseError`) si encore référencé par un vol ou une séance de gonflage, pour ne jamais perdre l'historique d'usage
- [x] Statut (`ACTIVE`/`SOLD`/`RETIRED`) plutôt que suppression, pour conserver l'historique même après revente ou mise hors service
- [x] Rattachement aux vols (voile/sellette/secours) et aux séances de gonflage (voile/sellette) — sélecteurs dans `FlightForm`/`GroundHandlingSessionForm`, limités au matériel `ACTIVE` du pilote (plus l'élément déjà sélectionné même si son statut a changé depuis)
- [x] Volume de pratique total jamais stocké, toujours recalculé (`initialUsageMin` + durées des vols/séances qui le référencent) — ADR 011 (`docs/decisions/011-equipment-usage-derived.md`)
- [x] Accès depuis la barre de navigation principale (`navEquipment`)

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

## Progression 📈

Page dédiée (`/progression`), accessible depuis la barre de navigation principale (promue depuis un emplacement secondaire suite à un retour utilisatrice — voir `apps/web/src/components/layout/nav-items.ts`). Dérivée des vols déjà enregistrés, aucune donnée supplémentaire à saisir. Reste en deçà de « statistiques avancées » (backlog) : pas de records personnels, pas de corrélation météo/GPS/matériel (voir `docs/product.md`).

Déjà construit (`src/features/flights/get-flight-progression.service.ts`, `src/features/flights/flight-progression-charts.ts`, `src/features/progression/get-parcours-timeline.service.ts`) :

- [x] Nombre de vols cumulé et temps de vol cumulé : valeur chiffrée (total) et badge delta vs mois précédent (toujours basés sur le cumulé), avec en dessous un graphique en bâtons des 3 derniers mois en valeurs mensuelles non cumulées — un premier essai en courbe cumulée, puis en bâtons sur le cumulé, ne montrait qu'une progression monotone peu parlante (retour utilisatrice) ; le badge delta reste neutre visuellement (Soft Status Rule), jamais teinté rouge/vert
- [x] Historique complet des paliers franchis (nombre de vols et heures de vol : 10/25/50/100/250/500/1000 — tous les paliers réellement atteints, pas seulement le plus haut annoncé en toast)
- [x] État vide dédié tant qu'aucun vol n'est enregistré ; message dédié tant qu'il n'y a pas assez de mois de données pour un graphique (moins de 2 points), précisant désormais combien de mois manquent
- [x] Répartition par type de vol (LOCAL, CROSS_COUNTRY, SOARING, THERMAL, TRAINING, OTHER) sur toute la période enregistrée, en barres — pas de camembert (ADR 012, `docs/decisions/012-progression-chart-bars-not-pie.md`), tous les types affichés même à 0 vol
- [x] Trois cartes statistiques simples côte à côte (grille identique au tableau de bord) : nombre de sites survolés (distincts, décollage et atterrissage confondus), vol le plus long, site préféré (site revenant le plus souvent, égalité tranchée par ordre chronologique) — aucune des trois n'a de courbe, un chiffre/nom suffit (retour utilisatrice sur la version courbe des sites)
- [x] Durée moyenne des vols par mois : valeur chiffrée du dernier mois actif et badge delta vs mois précédent, visibles dès le premier mois de données (pas besoin de 2 mois pour un chiffre unique) ; en dessous, un graphique en bâtons des 3 derniers mois en moyennes mensuelles brutes (pas cumulées, contrairement aux cartes nombre de vols/temps de vol), affiché seulement à partir de 2 mois de données
- [x] Section « Parcours » : timeline chronologique (plus récent en premier) des stages terminés (placés à leur date de fin, un stage se terminant aujourd'hui compte comme pas encore terminé) et des brevets obtenus, séparée de la liste des paliers de vol ; section entièrement masquée si aucun stage terminé ni brevet enregistré
- [x] Périmètre volontairement inchangé : vols uniquement pour les courbes/paliers (stages et gonflages toujours exclus, Parcours mis à part), pas d'objectifs/cibles personnalisés, granularité mensuelle uniquement (pas de bascule saison/année)

---

## Rappels importants sur les notions

### Sites de vol 🌍

- [x] Modèle `Spot`/`Site`/`SiteType` — un spot peut avoir plusieurs sites (décollage, atterrissage), chacun avec coordonnées GPS précises et altitude ; pas de "site principal" (ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md` ; renommage Site→Spot/SitePoint→Site voir ADR 007, `docs/decisions/007-site-spot-terminology-rename.md`)
- [x] `Spot.countryCode`/`School` enrichi (adresse structurée, code pays ISO) — prépare `School`/`Spot`/`Site` à une future gestion applicative sans construire l'interface (ADR 004, `docs/decisions/004-editable-referentials.md`)
- [x] `Flight.takeoffPointId`/`landingPointId` avec contrainte de type applicative + recherche de sites par nom dans le formulaire de vol (ADR 005)
- [x] Gestion des sites de vol — interface de création/modification d'un `Spot` et de ses `Site`, réservée aux administrateurs (`/admin/spots`, `/admin/sites`, voir section Administration)
- [x] Ajouter un spot manuellement — `/admin/spots/new` (admin uniquement)
- [ ] Ajouter progressivement les spots/sites/écoles connus (saisie manuelle via `/admin`)
- [ ] Prévoir une évolution vers des données externes (API), notamment le référentiel FFVL (spots, écoles) — étudier les données disponibles et une stratégie d'import avant toute implémentation

Informations prévues :

- Nom
- Localisation
- Altitude
- Informations complémentaires

### Statistiques avancées 📊

Hors périmètre du dashboard actuel (pas de filtrage avancé, pas de graphiques).

Progression dans le temps et répartition par type de vol : couvertes par la page `/progression` dédiée, pas par le dashboard — voir section [Progression](#progression-) ci-dessus.

- [ ] Statistiques par spot
- [ ] Records personnels
- [ ] Analyse des vols
- [ ] Comparaison de vols sur un même spot

---

## Déploiement 🚀

- [ ] Finaliser la configuration de production
- [ ] Neon pour PostgreSQL production
- [ ] Configurer les variables d'environnement de production
- [ ] Déployer sur Vercel
- [ ] Configurer les migrations Prisma en production
- [ ] Exécuter le seed public de référentiels en production
- [ ] Vérifier le parcours inscription → connexion → activités en production
- [ ] Mettre en place une stratégie de sauvegarde Neon
- [ ] Documenter la procédure de déploiement
- [x] Versionnage sémantique automatisé (`release-please`), tags Git synchronisés avec les déploiements, version affichée dans l'interface (ADR 006, `docs/decisions/006-versioning.md`)

---

## Idées futures 💡

Ces fonctionnalités sont volontairement hors MVP.

- [ ] Import de traces GPS / fichiers IGC — étudier le format des traces Garmin et l'import GPX en premier, avant tout format plus exotique
- [ ] Import automatique depuis une application Garmin dédiée (étudier faisabilité/accès aux données en amont)
- [ ] Carte des spots visités (incluant décollages/atterrissages, tracé des vols)
- [ ] Météo associée aux vols
- [ ] Photos associées aux activités
- [ ] Carnet de progression / objectifs personnels
- [ ] Suggestions d'amélioration basées sur l'historique
- [ ] Calendrier des activités
- [ ] Notifications / rappels
- [ ] Partage public optionnel d'un vol
- [ ] Export des données personnelles (JSON, PDF)

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
