# docs/domain-model.md

## Vocabulaire métier

### 'Flight'

Vol réalisé en parapente, entre un point de décollage et un point d'atterrissage (chacun rattaché à un spot), et éventuellement à un stage. Décollage et atterrissage peuvent appartenir à des spots différents (ex. vol de cross qui atterrit sur le décollage d'un autre spot).

### 'Spot'

Lieu général de pratique (une station, une vallée...) sans point précis associé : le spot ne désigne aucun décollage ni atterrissage particulier, ce rôle appartient exclusivement à `Site` (voir ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md`, et ADR 007, `docs/decisions/007-site-spot-terminology-rename.md`, pour le vocabulaire actuel).

### 'Site'

Point physique précis appartenant à un spot — décollage ou atterrissage, selon son `SiteType`. Un spot peut avoir plusieurs sites d'un même type ; aucun n'est désigné comme "principal" (voir ADR 005).

### 'TrainingCamp'

Période encadrée par une école ou un organisme de formation (stage, etc.).

### 'TrainingCampType'

Type d'un stage (initiation, progression, thermique, SIV...), table de référence — voir ADR 003 (`docs/decisions/003-reference-table-codes.md`). Remplace l'ancien champ `TrainingCamp.campType` (texte libre).

### 'GroundHandlingSession'

Séance de gonflage ou de travail au sol.

### 'Equipment'

Élément de matériel personnel d'un pilote — voile, sellette ou secours uniquement pour l'instant (voir `EquipmentType`). Piloté par un statut (`ACTIVE`/`SOLD`/`RETIRED`) plutôt que supprimé, pour conserver l'historique d'usage même après revente ou mise hors service.

### 'EquipmentType'

Catégorie d'un `Equipment` (voile, sellette, secours), table de référence — voir ADR 003 (`docs/decisions/003-reference-table-codes.md`).

### 'Qualification'

Brevet ou qualification de pilotage obtenu par un pilote (issue #171).
Rattachée directement à `User`, pas via `Activity` : à la différence de
`Flight`/`TrainingCamp`/`GroundHandlingSession`, un brevet n'est pas une
session de pratique datée mais un statut acquis, il n'apparaît donc pas
dans la timeline des activités.

---

## Entités principales

### User

- id
- name — prénom (label "Prénom" côté UI, colonne toujours nommée `name`)
- email
- emailVerified
- image (optionnel)
- city (optionnel) — ville de résidence, saisie via recherche BAN (`type=municipality`), affichée sous la marque dans la barre latérale/l'en-tête mobile quand renseignée
- role (`UserRole` : `USER`/`ADMIN`, défaut `USER`)
- createdAt
- updatedAt

Authentification email + mot de passe via Better Auth : le hash Argon2 vit
sur `Account` (provider `credential`), pas sur `User` — voir
docs/database-design.md pour le détail des modèles `Session`/`Account`/`Verification`.

`city`, contrairement à `name` (champ "core" de Better Auth), doit être
déclaré en `additionalFields` dans la config Better Auth (`src/lib/auth.ts`),
sans quoi `auth.api.updateUser`/`signUpEmail` l'ignoreraient silencieusement
malgré la colonne en base.

`role` détermine l'accès à `/admin` (`requireAdmin()`,
`src/lib/current-user.ts`) : jamais choisi par l'utilisateur à l'inscription,
`ADMIN` attribué uniquement en base — voir docs/admin.md.

---

### Spot

- id
- name
- region (optionnel)
- countryCode (optionnel) — code pays ISO 3166-1 alpha-2 (`FR`, `CH`, `IT`, `ES`...), pas du texte libre
- latitude (optionnel) — localisation approximative du spot
- longitude (optionnel)
- createdAt
- updatedAt

Pas de notion de "site principal" : un `Spot` ne référence aucun `Site` (voir ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md`).

Les spots seront saisis manuellement dans un premier temps. Donnée de référence partagée (pas de `userId`) : c'est un lieu du monde réel, pas une donnée privée à un utilisateur. Référentiel éditorial destiné à une future gestion applicative (ADR 004, `docs/decisions/004-editable-referentials.md`), à distinguer des tables de référence techniques comme `ActivityType`/`FlightType`/`SiteType` (ADR 003) : `Spot.name` reste une donnée métier éditoriale, jamais un code.

---

### Site

- id
- label
- spotId — spot auquel appartient le site
- siteTypeId — TAKEOFF ou LANDING : détermine le rôle que ce site peut jouer dans un `Flight` (`takeoffPointId` doit référencer un site TAKEOFF, `landingPointId` un site LANDING — vérifié côté applicatif, voir ADR 005)
- latitude, longitude — coordonnées précises (utilisation future dans une carte)
- altitudeM
- orientationDeg (optionnel) — pertinent pour un décollage, pas nécessairement pour un atterrissage

Donnée de référence partagée (pas de `userId`), au même titre que `Spot`. Référentiel éditorial (ADR 004), même principe que `Spot`/`School`.

---

### SiteType

- id
- code (unique) — `TAKEOFF`, `LANDING`

Table de référence (pas un enum), même principe qu'`ActivityType` : extensible sans migration si un nouveau type de site est nécessaire. Pas de `label` : catégorie technique traduisible, le libellé affiché vit dans `apps/web/src/lib/reference-labels.ts` (voir `docs/decisions/003-reference-table-codes.md`).

---

### School

- id
- name
- address (optionnel)
- postalCode (optionnel)
- city (optionnel)
- countryCode (optionnel) — code pays ISO 3166-1 alpha-2, même convention que `Spot.countryCode`
- latitude (optionnel)
- longitude (optionnel)
- website (optionnel)
- createdAt
- updatedAt

Référentiel éditorial (ADR 004), même principe que `Spot`.

Donnée de référence partagée (pas de `userId`), au même titre que `Spot`.

---

### Flight

- id
- trainingCampId (nullable)
- date — porte aussi l'heure (voir ci-dessous)
- takeoffPointId — `Site` de décollage (doit être de type TAKEOFF)
- landingPointId — `Site` d'atterrissage (doit être de type LANDING)
- durationMin
- flightTypeId — type de vol, table de référence (`FlightType` : LOCAL, CROSS_COUNTRY, SOARING, THERMAL, TRAINING, OTHER), pas de `label` — voir `SiteType`
- observations
- improvementPoints
- wingId (optionnel) — `Equipment` de type WING utilisée pour ce vol
- harnessId (optionnel) — `Equipment` de type HARNESS utilisée pour ce vol
- reserveId (optionnel) — `Equipment` de type RESERVE emportée pour ce vol

Le rattachement à un utilisateur se fait via l'`Activity` parente (`Activity.userId`), pas de duplication sur `Flight`. Pas de `spotId` ni d'altitudes propres : dérivées de `takeoffPoint`/`landingPoint` (voir `Site`), pour éviter de stocker deux fois la même information physique. Le `Flight` ne référence jamais directement un `Spot` : les spots de décollage et d'atterrissage se déduisent de `takeoffPoint.spot`/`landingPoint.spot`, potentiellement différents (voir ADR 005) — important pour les vols de distance.

`wingId`/`harnessId`/`reserveId` sont trois colonnes nullable distinctes plutôt qu'une relation générique, même principe que `takeoffPointId`/`landingPointId` (voir `Site` ci-dessus) : chacune doit référencer un `Equipment` du bon `EquipmentType` (`wingId` → WING, `harnessId` → HARNESS, `reserveId` → RESERVE), vérifié côté applicatif comme pour `takeoffPointId`/`landingPointId` (voir ADR 005), pas exprimable en contrainte SQL.

`date` porte une heure (saisie via un champ dédié, combinée en un seul
`DateTime`) en plus du jour : nécessaire pour ordonner plusieurs vols le
même jour (`getActivityEventDate`, `features/activities/queries.ts`), sans
quoi ils seraient tous ancrés à minuit et indistinguables par ordre
chronologique. L'heure est stockée telle qu'elle est saisie, sans
conversion de fuseau horaire (voir `lib/validations/flight.ts`) — pas de
notion de fuseau utilisateur dans l'application. Pas de champ "date de fin"
séparé : se déduit de `date` + `durationMin` au besoin, à l'affichage.

---

### TrainingCamp

- id
- schoolId
- trainingCampTypeId — type de stage, table de référence (`TrainingCampType` : INITIATION, AUTONOMY, ADVANCED, THERMAL, CROSS_COUNTRY, SIV, HIKE_AND_FLY, ACRO_DISCOVERY, ACRO_ADVANCED, SAFETY, OTHER), pas de `label` — voir `TrainingCampType`
- qualificationTypeId (nullable) — brevet éventuellement obtenu pendant le stage, table de référence `QualificationType` (voir Qualification ci-dessus) ; remplace l'ancien champ `certification` (texte libre) pour que ce brevet soit sélectionné et affiché de façon structurée plutôt que saisi à la main — n'entraîne pas la création automatique d'une `Qualification` personnelle dans `/qualifications`
- startDate
- endDate
- observations (nullable)
- summary

Le rattachement à un utilisateur se fait via l'`Activity` parente, pas de duplication sur `TrainingCamp`.

Pas d'heure sur `startDate`/`endDate`, contrairement à `Flight.date`/
`GroundHandlingSession.date` : un stage s'étend déjà sur plusieurs jours,
l'heure n'apporterait rien pour l'ordonner (voir `getActivityEventDate`).

Relation :

- un stage peut contenir plusieurs vols et plusieurs séances de gonflage ;
- un vol appartient au maximum à un stage ;
- une séance de gonflage appartient au maximum à un stage.

---

### TrainingCampType

- id
- code (unique) — `INITIATION`, `AUTONOMY`, `ADVANCED`, `THERMAL`, `CROSS_COUNTRY`, `SIV`, `HIKE_AND_FLY`, `ACRO_DISCOVERY`, `ACRO_ADVANCED`, `SAFETY`, `OTHER`
- createdAt
- updatedAt

Table de référence (pas un enum), même principe qu'`ActivityType`/`SiteType`/`FlightType` : extensible sans migration si un nouveau type de stage est nécessaire. Pas de `label` : le libellé affiché vit dans `apps/web/src/lib/reference-labels.ts` (voir `docs/decisions/003-reference-table-codes.md`). Porte `createdAt`/`updatedAt` à la différence des autres tables de référence ci-dessus (demande explicite pour cette table, pas un oubli).

---

### GroundHandlingSession

- id
- trainingCampId (nullable)
- date — porte aussi l'heure, même principe que `Flight.date`
- spotId
- durationMin
- exercises
- difficulties (optionnel)
- feeling (optionnel)
- wingId (optionnel) — `Equipment` de type WING utilisée pendant la séance
- harnessId (optionnel) — `Equipment` de type HARNESS utilisée pendant la séance

Le rattachement à un utilisateur se fait via l'`Activity` parente, pas de duplication sur `GroundHandlingSession`.

Pas de `reserveId` ici, à la différence de `Flight` : le secours ne s'utilise/s'use pas pendant une séance de gonflage.

---

### Equipment

- id
- userId — donnée personnelle par pilote, pas un référentiel partagé (à la différence de `Spot`/`Site`/`School`, ADR 004) : chaque pilote gère son propre matériel
- equipmentTypeId — catégorie (`EquipmentType` : WING, HARNESS, RESERVE)
- brand — marque, texte libre
- model — modèle, texte libre
- size (optionnel) — texte libre : le format varie selon la catégorie (surface en m² pour une voile, lettre S/M/L pour une sellette, plage de poids pour un secours), pas un champ typé unique
- purchaseDate
- condition — `NEW` ou `USED`
- initialUsageMin (optionnel, 0 par défaut) — volume de pratique déjà accumulé avant l'achat ; pertinent uniquement si `condition = USED` (voir Règles métier)
- status — `ACTIVE`, `SOLD` ou `RETIRED` (défaut `ACTIVE`)
- createdAt
- updatedAt

Référencé par `Flight` (`wingId`/`harnessId`/`reserveId`) et `GroundHandlingSession` (`wingId`/`harnessId`) — voir ci-dessus.

Le volume total de pratique d'un `Equipment` (`initialUsageMin` + somme des `durationMin` de tous les `Flight`/`GroundHandlingSession` qui le référencent) n'est **jamais stocké** : toujours calculé à la demande, même principe que les statistiques du tableau de bord (`docs/product.md`) — voir ADR 010 (`docs/decisions/010-equipment-usage-derived.md`).

Jamais supprimé une fois référencé par une activité : suppression bloquée (`ReferenceDataInUseError`), même principe que `Spot`/`Site`/`School` (voir `docs/admin.md`), pour ne jamais perdre l'historique d'usage d'un équipement revendu. `status = SOLD`/`RETIRED` est le moyen prévu de retirer un équipement de la circulation sans perdre son historique.

---

### EquipmentType

- id
- code (unique) — `WING`, `HARNESS`, `RESERVE`

Table de référence (pas un enum), même principe qu'`ActivityType`/`SiteType`/`FlightType`/`TrainingCampType`/`QualificationType` — voir ADR 003. Pas de `label`, même principe.

---

### Qualification

- id
- userId — premier modèle métier à référencer `User` directement (pas via `Activity` : ce n'est pas une spécialisation d'`Activity`, voir ci-dessus)
- qualificationTypeId
- obtainedDate (date sans heure)
- schoolId (optionnel) — école ayant délivré le brevet
- trainingCampId (optionnel) — stage au cours duquel il a été obtenu
- notes (optionnel)
- createdAt
- updatedAt

Suppression d'une `School`/d'un `TrainingCamp` référencé : dissociation (`onDelete: SetNull`, `schoolId`/`trainingCampId` optionnels), jamais suppression ni blocage — même principe que `Flight.trainingCampId`/`GroundHandlingSession.trainingCampId`.

---

### QualificationType

- id
- code (unique) — `INITIATION`, `PILOT`, `CONFIRMED_PILOT`, `TANDEM`, `SIV`, `INSTRUCTOR`, `OTHER`

Table de référence (pas un enum), même principe qu'`ActivityType`/`SiteType`/`FlightType`/`TrainingCampType` : extensible sans migration. Alimentée par un seed dédié (`prisma/seed-qualification-types.ts`), exécutable indépendamment du seed principal (`pnpm --filter web prisma:seed:qualification-types`) pour peupler preview et production séparément — pas de CRUD applicatif pour l'instant.

---

## Règles métier

### Vol

- la durée doit être **strictement positive** ;
- les observations et points d’amélioration sont obligatoires afin d’encourager le suivi de progression ;
- la date du vol ne peut pas être **dans le futur** ;
- takeoffPoint doit exister et être un `Site` de type TAKEOFF ; landingPoint doit exister et être un `Site` de type LANDING (vérifié côté applicatif, pas exprimable en contrainte SQL — voir ADR 005) ;
- aucune contrainte ne compare leurs altitudes ni n'exige qu'ils appartiennent au même spot (un vol de cross peut atterrir sur le décollage d'un autre spot, potentiellement plus haut).

### Stage

- `startDate <= endDate` ;
- les vols et séances de gonflage associés doivent avoir une date comprise dans l’intervalle du stage.

### Gonflage

- la durée doit être strictement positive ;
- les exercices travaillés sont obligatoires.

### Qualification

- `qualificationTypeId` doit exister ;
- `obtainedDate` ne peut pas être dans le futur ;
- si `schoolId` est renseigné, l'école doit exister ;
- si `trainingCampId` est renseigné, le stage doit exister et appartenir à l'utilisateur courant.

### Matériel

- `initialUsageMin` n'a de sens que si `condition = USED` ; si `condition = NEW`, il vaut 0 ;
- `wingId`/`harnessId`/`reserveId` (sur `Flight`) et `wingId`/`harnessId` (sur `GroundHandlingSession`) doivent référencer un `Equipment` appartenant à l'utilisateur courant et du bon `EquipmentType` (ex. `wingId` doit pointer vers un `Equipment` de type WING) ;
- le volume total de pratique d'un `Equipment` n'est jamais stocké, toujours recalculé (voir ci-dessus, ADR 010) ;
- un `Equipment` référencé par au moins un `Flight`/`GroundHandlingSession` ne peut pas être supprimé (`ReferenceDataInUseError`) ; le retirer de la circulation passe par `status = SOLD`/`RETIRED`, jamais par une suppression.

### Suppression

Une activité (Vol, Stage ou Gonflage) se supprime en supprimant son `Activity` : la spécialisation associée (`Flight`/`TrainingCamp`/`GroundHandlingSession`) est supprimée en cascade par la base (`onDelete: Cascade` sur la relation vers `Activity`). Un seul service (`deleteActivity`) suffit donc pour les trois types.

Cas particulier du Stage : les vols et séances de gonflage qui lui sont rattachés (`trainingCampId`) ne sont **pas** supprimés avec lui — la contrainte est en `onDelete: SetNull`, ils sont seulement dissociés du stage. Décision produit délibérée (pas seulement le comportement par défaut de Prisma) : supprimer un stage ne doit pas faire perdre des vols/séances déjà enregistrés.

---

## Priorité MVP

Section historique : scope du MVP initial, aujourd'hui dépassé (Equipment,
Qualification et l'administration ont depuis été livrés — voir
`docs/todo.md` pour le suivi d'avancement à jour).

### Inclus

- User
- Spot
- Site / SiteType
- School
- Flight
- TrainingCamp
- GroundHandlingSession

### Livré après le MVP

- Equipment / EquipmentType — modèle décrit dans les sections dédiées ci-dessus et ADR 010 ; implémenté (voir `docs/todo.md`, section Matériel)
- Qualification / QualificationType — modèle décrit ci-dessus (issue #171) ; implémenté (voir `docs/todo.md`, section Brevets et qualifications)

### Toujours backlog

- WeatherObservation
- IGCTrack
- FlightStatisticsSnapshot
- `GroundHandlingSession` migré vers un `Site` unique (actuellement toujours rattaché directement à un `Spot`, voir ADR — choix assumé, pas un oubli)
