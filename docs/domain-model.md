# docs/domain-model.md

## Vocabulaire métier

### 'Flight'

Vol réalisé en parapente, entre un point de départ et un point d'arrivée (chacun rattaché à un site), et éventuellement à un stage. Départ et arrivée peuvent appartenir à des sites différents (ex. vol de cross qui atterrit sur le décollage d'un autre site).

### 'SitePoint'

Point physique appartenant à un site (décollage, atterrissage...). Un site peut avoir plusieurs points d'un même type ; voir `Site.primaryTakeoffPointId`/`primaryLandingPointId` pour le point principal.

### 'TrainingCamp'

Période encadrée par une école ou un organisme de formation (stage, etc.).

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
- createdAt
- updatedAt

Authentification email + mot de passe via Better Auth : le hash Argon2 vit
sur `Account` (provider `credential`), pas sur `User` — voir
docs/database-design.md pour le détail des modèles `Session`/`Account`/`Verification`.

---

### Site

- id
- name
- region (optionnel)
- country (optionnel)
- latitude (optionnel) — localisation approximative du site
- longitude (optionnel)
- primaryTakeoffPointId (optionnel) — décollage principal du site, parmi ses éventuels `SitePoint` de type TAKEOFF
- primaryLandingPointId (optionnel) — atterrissage principal du site, parmi ses éventuels `SitePoint` de type LANDING
- createdAt
- updatedAt

Les sites seront saisis manuellement dans un premier temps. Donnée de référence partagée (pas de `userId`) : c'est un lieu du monde réel, pas une donnée privée à un utilisateur.

---

### SitePoint

- id
- label
- siteId — site auquel appartient le point
- sitePointTypeId — fonction habituelle du point dans le référentiel du site (décollage, atterrissage...), pas son rôle dans un `Flight` donné : un point de type TAKEOFF peut être utilisé comme point d'arrivée d'un vol
- latitude, longitude — coordonnées précises (utilisation future dans une carte)
- altitudeM
- orientationDeg (optionnel) — pertinent pour un décollage, pas nécessairement pour un atterrissage

Donnée de référence partagée (pas de `userId`), au même titre que `Site`.

---

### SitePointType

- id
- code (unique) — `TAKEOFF`, `LANDING`
- label

Table de référence (pas un enum), même principe qu'`ActivityType` : extensible sans migration si un nouveau type de point est nécessaire.

---

### School

- id
- name
- website (optionnel)
- location (optionnel)
- createdAt
- updatedAt

Donnée de référence partagée (pas de `userId`), au même titre que `Site`.

---

### Flight

- id
- trainingCampId (nullable)
- date
- departurePointId — `SitePoint` de départ
- arrivalPointId — `SitePoint` d'arrivée
- durationMin
- flightType
- observations
- improvementPoints

Le rattachement à un utilisateur se fait via l'`Activity` parente (`Activity.userId`), pas de duplication sur `Flight`. Pas de `siteId` ni d'altitudes propres : dérivées de `departurePoint`/`arrivalPoint` (voir `SitePoint`), pour éviter de stocker deux fois la même information physique.

---

### TrainingCamp

- id
- schoolId
- campType
- startDate
- endDate
- summary
- certification (nullable)

Le rattachement à un utilisateur se fait via l'`Activity` parente, pas de duplication sur `TrainingCamp`.

Relation :

- un stage peut contenir plusieurs vols et plusieurs séances de gonflage ;
- un vol appartient au maximum à un stage ;
- une séance de gonflage appartient au maximum à un stage.

---

### GroundHandlingSession

- id
- trainingCampId (nullable)
- date
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
- departurePoint et arrivalPoint doivent exister, mais aucune contrainte ne compare leurs altitudes ni n'exige qu'ils appartiennent au même site (un vol de cross peut atterrir sur le décollage d'un autre site, potentiellement plus haut).

### Stage

- `startDate <= endDate` ;
- les vols et séances de gonflage associés doivent avoir une date comprise dans l’intervalle du stage.

### Gonflage

- la durée doit être strictement positive ;
- les exercices travaillés sont obligatoires.

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
