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
- passwordHash / provider
- createdAt

---

### Site

- id
- name
- region
- country
- latitude (optionnel)
- longitude (optionnel)

Les sites seront saisis manuellement dans un premier temps.

---

### Flight

- id
- userId
- trainingCampId (nullable)
- date
- siteId
- takeoffAltitudeM
- landingAltitudeM
- durationMin
- flightType
- observations
- improvementPoints
- equipmentNotes (nullable)

---

### TrainingCamp

- id
- userId
- schoolName
- campType
- startDate
- endDate
- summary
- certification (nullable)

Relation :

- un stage peut contenir plusieurs vols ;
- un vol appartient au maximum à un stage.

---

### GroundHandlingSession

- id
- userId
- date
- siteId
- durationMin
- exercises
- difficulties
- feeling

---

## Règles métier

### Vol

- la durée doit être **strictement positive** ;
- l’altitude de décollage doit être **supérieure** à l’altitude d’atterrissage ;
- les observations et points d’amélioration sont obligatoires afin d’encourager le suivi de progression.

### Stage

- `startDate <= endDate` ;
- les vols associés doivent avoir une date comprise dans l’intervalle du stage.

### Gonflage

- la durée doit être strictement positive ;
- les exercices travaillés sont obligatoires.

---

## Priorité MVP

### Inclus

- User
- Site
- Flight
- TrainingCamp
- GroundHandlingSession

### Plus tard

- Equipment
- WeatherObservation
- IGCTrack
- SiteTakeoff / SiteLanding
- FlightStatisticsSnapshot
