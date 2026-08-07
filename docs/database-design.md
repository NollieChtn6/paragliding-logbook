# Database Design

## Principes

- PostgreSQL
- Prisma ORM
- UUID pour toutes les clés primaires
- données métier isolées par utilisateur (exception justifiée : `Site` et `School` sont des données de référence du monde réel, partagées entre utilisateurs)

---

## Entités

### User

Utilisateur de l'application.

---

### Activity

Entrée générique du journal.

Attributs :

- id
- userId
- activityTypeId
- createdAt
- updatedAt

---

### ActivityType

Référentiel des types d'activité.

Valeurs initiales :

- FLIGHT
- TRAINING_CAMP
- GROUND_HANDLING

---

### Flight

Spécialisation d'une Activity.

Relations :

- appartient à une Activity
- appartient à un Site
- peut appartenir à un TrainingCamp

Champs :

- date
- takeoffAltitude
- landingAltitude
- durationMinutes
- flightType
- observations
- improvements

---

### TrainingCamp

Spécialisation d'une Activity.

Champs :

- startDate
- endDate
- schoolId
- stageType
- assessment
- certification

---

### GroundHandlingSession

Spécialisation d'une Activity.

Champs :

- date
- siteId
- durationMinutes
- exercises
- difficulties
- feeling

---

### Site

Lieu de pratique.

Champs :

- name
- location
- latitude
- longitude

---

### School

École fédérale de parapente.

Champs :

- name
- website
- location

---

## Relations

User 1,N Activity

Activity 1,1 ActivityType

Activity 1,0..1 Flight

Activity 1,0..1 TrainingCamp

Activity 1,0..1 GroundHandlingSession

Site 1,N Flight

Site 1,N GroundHandlingSession

TrainingCamp 1,N Flight

School 1,N TrainingCamp