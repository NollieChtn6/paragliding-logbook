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

Champs :

- id
- name
- email
- passwordHash (hashé avec Argon2, jamais en clair)
- createdAt
- updatedAt

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

Référentiel des types d'activité (table, pas un enum : extensible sans migration).

Champs :

- id
- code (unique)
- label

Valeurs initiales (peuplées par le seed) :

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
- takeoffAltitudeM
- landingAltitudeM
- durationMin
- flightType
- observations
- improvementPoints

---

### TrainingCamp

Spécialisation d'une Activity.

Champs :

- startDate
- endDate
- schoolId
- campType
- summary (optionnel)
- certification (optionnel)

---

### GroundHandlingSession

Spécialisation d'une Activity.

Champs :

- date
- siteId
- durationMin
- exercises
- difficulties (optionnel)
- feeling (optionnel)

---

### Site

Lieu de pratique.

Champs :

- name
- region (optionnel)
- country (optionnel)
- latitude (optionnel)
- longitude (optionnel)
- createdAt
- updatedAt

---

### School

École fédérale de parapente.

Champs :

- name
- website (optionnel)
- location (optionnel)
- createdAt
- updatedAt

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