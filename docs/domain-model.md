# docs/domain-model.md

## Vocabulaire métier

### 'Flight'

Vol réalisé en parapente, entre un point de décollage et un point d'atterrissage (chacun rattaché à un site), et éventuellement à un stage. Décollage et atterrissage peuvent appartenir à des sites différents (ex. vol de cross qui atterrit sur le décollage d'un autre site).

### 'Site'

Lieu général de pratique (une station, une vallée...) sans point précis associé : le site ne désigne aucun décollage ni atterrissage particulier, ce rôle appartient exclusivement à `SitePoint` (voir ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md`).

### 'SitePoint'

Point physique précis appartenant à un site — décollage ou atterrissage, selon son `SitePointType`. Un site peut avoir plusieurs points d'un même type ; aucun n'est désigné comme "principal" (voir ADR 005).

### 'TrainingCamp'

Période encadrée par une école ou un organisme de formation (stage, etc.).

### 'TrainingCampType'

Type d'un stage (initiation, progression, thermique, SIV...), table de référence — voir ADR 003 (`docs/decisions/003-reference-table-codes.md`). Remplace l'ancien champ `TrainingCamp.campType` (texte libre).

### 'GroundHandlingSession'

Séance de gonflage ou de travail au sol.

---

## Entités principales

### User

- id
- name
- email
- emailVerified
- image (optionnel)
- role (`UserRole` : `USER`/`ADMIN`, défaut `USER`)
- createdAt
- updatedAt

Authentification email + mot de passe via Better Auth : le hash Argon2 vit
sur `Account` (provider `credential`), pas sur `User` — voir
docs/database-design.md pour le détail des modèles `Session`/`Account`/`Verification`.

`role` détermine l'accès à `/admin` (`requireAdmin()`,
`src/lib/current-user.ts`) : jamais choisi par l'utilisateur à l'inscription,
`ADMIN` attribué uniquement en base — voir docs/admin.md.

---

### Site

- id
- name
- region (optionnel)
- countryCode (optionnel) — code pays ISO 3166-1 alpha-2 (`FR`, `CH`, `IT`, `ES`...), pas du texte libre
- latitude (optionnel) — localisation approximative du site
- longitude (optionnel)
- createdAt
- updatedAt

Pas de notion de "point principal" : un `Site` ne référence aucun `SitePoint` (voir ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md`).

Les sites seront saisis manuellement dans un premier temps. Donnée de référence partagée (pas de `userId`) : c'est un lieu du monde réel, pas une donnée privée à un utilisateur. Référentiel éditorial destiné à une future gestion applicative (ADR 004, `docs/decisions/004-editable-referentials.md`), à distinguer des tables de référence techniques comme `ActivityType`/`FlightType`/`SitePointType` (ADR 003) : `Site.name` reste une donnée métier éditoriale, jamais un code.

---

### SitePoint

- id
- label
- siteId — site auquel appartient le point
- sitePointTypeId — TAKEOFF ou LANDING : détermine le rôle que ce point peut jouer dans un `Flight` (`takeoffPointId` doit référencer un point TAKEOFF, `landingPointId` un point LANDING — vérifié côté applicatif, voir ADR 005)
- latitude, longitude — coordonnées précises (utilisation future dans une carte)
- altitudeM
- orientationDeg (optionnel) — pertinent pour un décollage, pas nécessairement pour un atterrissage

Donnée de référence partagée (pas de `userId`), au même titre que `Site`. Référentiel éditorial (ADR 004), même principe que `Site`/`School`.

---

### SitePointType

- id
- code (unique) — `TAKEOFF`, `LANDING`

Table de référence (pas un enum), même principe qu'`ActivityType` : extensible sans migration si un nouveau type de point est nécessaire. Pas de `label` : catégorie technique traduisible, le libellé affiché vit dans `apps/web/src/lib/reference-labels.ts` (voir `docs/decisions/003-reference-table-codes.md`).

---

### School

- id
- name
- address (optionnel)
- postalCode (optionnel)
- city (optionnel)
- countryCode (optionnel) — code pays ISO 3166-1 alpha-2, même convention que `Site.countryCode`
- latitude (optionnel)
- longitude (optionnel)
- website (optionnel)
- createdAt
- updatedAt

Référentiel éditorial (ADR 004), même principe que `Site`.

Donnée de référence partagée (pas de `userId`), au même titre que `Site`.

---

### Flight

- id
- trainingCampId (nullable)
- date — porte aussi l'heure (voir ci-dessous)
- takeoffPointId — `SitePoint` de décollage (doit être de type TAKEOFF)
- landingPointId — `SitePoint` d'atterrissage (doit être de type LANDING)
- durationMin
- flightTypeId — type de vol, table de référence (`FlightType` : LOCAL, CROSS_COUNTRY, SOARING, THERMAL, TRAINING, OTHER), pas de `label` — voir `SitePointType`
- observations
- improvementPoints

Le rattachement à un utilisateur se fait via l'`Activity` parente (`Activity.userId`), pas de duplication sur `Flight`. Pas de `siteId` ni d'altitudes propres : dérivées de `takeoffPoint`/`landingPoint` (voir `SitePoint`), pour éviter de stocker deux fois la même information physique. Le `Flight` ne référence jamais directement un `Site` : les sites de décollage et d'atterrissage se déduisent de `takeoffPoint.site`/`landingPoint.site`, potentiellement différents (voir ADR 005) — important pour les vols de distance.

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
- startDate
- endDate
- observations (nullable)
- summary
- certification (nullable)

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

Table de référence (pas un enum), même principe qu'`ActivityType`/`SitePointType`/`FlightType` : extensible sans migration si un nouveau type de stage est nécessaire. Pas de `label` : le libellé affiché vit dans `apps/web/src/lib/reference-labels.ts` (voir `docs/decisions/003-reference-table-codes.md`). Porte `createdAt`/`updatedAt` à la différence des autres tables de référence ci-dessus (demande explicite pour cette table, pas un oubli).

---

### GroundHandlingSession

- id
- trainingCampId (nullable)
- date — porte aussi l'heure, même principe que `Flight.date`
- siteId
- durationMin
- exercises
- difficulties (optionnel)
- feeling (optionnel)

Le rattachement à un utilisateur se fait via l'`Activity` parente, pas de duplication sur `GroundHandlingSession`.

---

## Règles métier

### Vol

- la durée doit être **strictement positive** ;
- les observations et points d’amélioration sont obligatoires afin d’encourager le suivi de progression ;
- la date du vol ne peut pas être **dans le futur** ;
- takeoffPoint doit exister et être un `SitePoint` de type TAKEOFF ; landingPoint doit exister et être un `SitePoint` de type LANDING (vérifié côté applicatif, pas exprimable en contrainte SQL — voir ADR 005) ;
- aucune contrainte ne compare leurs altitudes ni n'exige qu'ils appartiennent au même site (un vol de cross peut atterrir sur le décollage d'un autre site, potentiellement plus haut).

### Stage

- `startDate <= endDate` ;
- les vols et séances de gonflage associés doivent avoir une date comprise dans l’intervalle du stage.

### Gonflage

- la durée doit être strictement positive ;
- les exercices travaillés sont obligatoires.

### Suppression

Une activité (Vol, Stage ou Gonflage) se supprime en supprimant son `Activity` : la spécialisation associée (`Flight`/`TrainingCamp`/`GroundHandlingSession`) est supprimée en cascade par la base (`onDelete: Cascade` sur la relation vers `Activity`). Un seul service (`deleteActivity`) suffit donc pour les trois types.

Cas particulier du Stage : les vols et séances de gonflage qui lui sont rattachés (`trainingCampId`) ne sont **pas** supprimés avec lui — la contrainte est en `onDelete: SetNull`, ils sont seulement dissociés du stage. Décision produit délibérée (pas seulement le comportement par défaut de Prisma) : supprimer un stage ne doit pas faire perdre des vols/séances déjà enregistrés.

---

## Priorité MVP

### Inclus

- User
- Site
- SitePoint / SitePointType
- School
- Flight
- TrainingCamp
- GroundHandlingSession

### Plus tard

- Equipment (dont `Flight.equipmentNotes`)
- WeatherObservation
- IGCTrack
- FlightStatisticsSnapshot
- `GroundHandlingSession` migré vers un `SitePoint` unique (actuellement toujours rattaché directement à un `Site`, voir ADR — choix assumé, pas un oubli)
