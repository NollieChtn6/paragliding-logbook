# docs/domain-model.md

## Vocabulaire métier

### 'Flight'

Vol réalisé en parapente, associé à un site et éventuellement à un stage.

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
- latitude (optionnel)
- longitude (optionnel)
- createdAt
- updatedAt

Les sites seront saisis manuellement dans un premier temps. Donnée de référence partagée (pas de `userId`) : c'est un lieu du monde réel, pas une donnée privée à un utilisateur.

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
- siteId
- takeoffAltitudeM
- landingAltitudeM
- durationMin
- flightType
- observations
- improvementPoints

Le rattachement à un utilisateur se fait via l'`Activity` parente (`Activity.userId`), pas de duplication sur `Flight`.

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
- l’altitude de décollage doit être **supérieure** à l’altitude d’atterrissage ;
- les observations et points d’amélioration sont obligatoires afin d’encourager le suivi de progression ;
- la date du vol ne peut pas être **dans le futur**.

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
- School
- Flight
- TrainingCamp
- GroundHandlingSession

### Plus tard

- Equipment (dont `Flight.equipmentNotes`)
- WeatherObservation
- IGCTrack
- SiteTakeoff / SiteLanding
- FlightStatisticsSnapshot
