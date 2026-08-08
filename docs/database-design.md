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
- emailVerified
- image (optionnel)
- createdAt
- updatedAt

Pas de mot de passe sur `User` : le hash Argon2 vit sur `Account` (voir ci-dessous).

---

### Session, Account, Verification

Modèles imposés par Better Auth (authentification), voir `apps/web/src/lib/auth.ts`.

**Session** : session active d'un utilisateur.

- id
- userId
- token (unique)
- expiresAt
- ipAddress (optionnel)
- userAgent (optionnel)
- createdAt
- updatedAt

**Account** : compte de connexion. Un seul provider utilisé pour l'instant, `credential` (email + mot de passe) — un `User` a un `Account` de ce type.

- id
- userId
- accountId
- providerId (`credential` pour l'instant)
- password (hash Argon2, uniquement pour le provider `credential`)
- accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, idToken (optionnels, providers OAuth non utilisés pour l'instant)
- createdAt
- updatedAt

**Verification** : jetons de vérification (ex. vérification d'email) — table prévue par Better Auth, non utilisée activement pour l'instant (pas de vérification d'email dans le MVP).

- id
- identifier
- value
- expiresAt
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

Pas de `label` : catégorie technique traduisible, le libellé affiché vit dans `apps/web/src/lib/reference-labels.ts` (voir `docs/decisions/003-reference-table-codes.md`).

Valeurs initiales (peuplées par le seed) :

- FLIGHT
- TRAINING_CAMP
- GROUND_HANDLING

---

### Flight

Spécialisation d'une Activity.

Relations :

- appartient à une Activity
- departurePoint et arrivalPoint : chacun un SitePoint, potentiellement de sites différents (voir SitePoint ci-dessous)
- peut appartenir à un TrainingCamp
- appartient à un FlightType

Champs :

- date
- durationMin
- observations
- improvementPoints

Pas de `siteId` ni d'altitudes propres (`takeoffAltitudeM`/`landingAltitudeM` retirés) : redondants avec `departurePoint.altitudeM`/`arrivalPoint.altitudeM`.

---

### FlightType

Référentiel des types de vol (table, pas un enum : extensible sans migration, même principe qu'`ActivityType`).

Champs :

- id
- code (unique)

Pas de `label`, même principe que `ActivityType`/`SitePointType`.

Valeurs initiales (peuplées par le seed) :

- LOCAL
- CROSS_COUNTRY
- SOARING
- THERMAL
- TRAINING
- OTHER

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

Relations :

- appartient à une Activity
- appartient à un Site
- peut appartenir à un TrainingCamp

Champs :

- date
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
- latitude (optionnel) — localisation approximative du site
- longitude (optionnel)
- primaryTakeoffPointId (optionnel, FK SitePoint) — décollage principal
- primaryLandingPointId (optionnel, FK SitePoint) — atterrissage principal
- createdAt
- updatedAt

`primaryTakeoffPointId`/`primaryLandingPointId` doivent référencer un `SitePoint` du même `Site` et du bon `SitePointType` (TAKEOFF/LANDING respectivement) : non exprimable nativement en Postgres/Prisma (pas de CHECK inter-lignes), vérifié côté applicatif.

---

### SitePoint

Point physique appartenant à un Site (décollage, atterrissage...). Un Site peut avoir plusieurs `SitePoint` d'un même `SitePointType` ; `Site.primaryTakeoffPointId`/`primaryLandingPointId` désignent le point principal, pas l'ensemble des points.

Relations :

- appartient à un Site
- appartient à un SitePointType

Champs :

- label
- latitude, longitude (utilisation future dans une carte)
- altitudeM
- orientationDeg (optionnel)

Le type d'un `SitePoint` est sa fonction habituelle dans le référentiel du site, pas son rôle dans un `Flight` donné : un point TAKEOFF peut être utilisé comme `arrivalPoint` d'un vol.

---

### SitePointType

Référentiel des types de point (table, pas un enum : extensible sans migration, même principe qu'`ActivityType`).

Champs :

- id
- code (unique)

Pas de `label`, même principe que `ActivityType`.

Valeurs initiales (peuplées par le seed) :

- TAKEOFF
- LANDING

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

User 1,N Session

User 1,N Account

Activity 1,1 ActivityType

Activity 1,0..1 Flight

Activity 1,0..1 TrainingCamp

Activity 1,0..1 GroundHandlingSession

Site 1,N SitePoint

Site 0..1,1 SitePoint (primaryTakeoffPoint)

Site 0..1,1 SitePoint (primaryLandingPoint)

SitePointType 1,N SitePoint

SitePoint 1,N Flight (departurePoint)

SitePoint 1,N Flight (arrivalPoint)

FlightType 1,N Flight

Site 1,N GroundHandlingSession

TrainingCamp 1,N Flight

TrainingCamp 1,N GroundHandlingSession

School 1,N TrainingCamp