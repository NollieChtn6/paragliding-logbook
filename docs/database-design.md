# Database Design

## Principes

- PostgreSQL
- Prisma ORM
- UUID pour toutes les clés primaires
- données métier isolées par utilisateur (exception justifiée : `Spot`, `Site` et `School` sont des données de référence du monde réel, partagées entre utilisateurs)

---

## Entités

### User

Utilisateur de l'application.

Champs :

- id
- name — prénom (label "Prénom" côté UI)
- email
- emailVerified
- image (optionnel)
- city (optionnel) — ville de résidence, recherche BAN (`type=municipality`)
- role (`UserRole` : `USER`/`ADMIN`, défaut `USER`)
- createdAt
- updatedAt

Pas de mot de passe sur `User` : le hash Argon2 vit sur `Account` (voir ci-dessous).

`name` est un champ "core" de Better Auth (géré nativement, sans
configuration) ; `city` doit en revanche être déclaré en `additionalFields`
(`src/lib/auth.ts`) pour qu'`auth.api.updateUser`/`signUpEmail` l'acceptent
— contrairement à `role`, jamais exposé à Better Auth (voir ci-dessous).

`role` : jamais choisi par l'utilisateur (non exposé à Better Auth comme
additionalField), `ADMIN` attribué uniquement en base — voir
`requireAdmin()` (`src/lib/current-user.ts`) et `docs/admin.md`.

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
- takeoffPoint et landingPoint : chacun un Site, potentiellement de spots différents (voir Site ci-dessous)
- peut appartenir à un TrainingCamp
- appartient à un FlightType
- peut référencer jusqu'à trois `Equipment` : `wing` (voile), `harness` (sellette), `reserve` (secours)

Champs :

- date — porte aussi l'heure (`DateTime`, pas de conversion de fuseau horaire), nécessaire pour ordonner plusieurs vols le même jour
- durationMin
- observations
- improvementPoints

Pas de `spotId` ni d'altitudes propres (`takeoffAltitudeM`/`landingAltitudeM` retirés) : redondants avec `takeoffPoint.altitudeM`/`landingPoint.altitudeM`. Le `Flight` ne référence jamais un `Spot` directement (voir ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md`, et ADR 007, `docs/decisions/007-site-spot-terminology-rename.md`, pour le vocabulaire actuel) : `takeoffPointId` doit référencer un `Site` de type TAKEOFF, `landingPointId` un `Site` de type LANDING — non exprimable en contrainte SQL (le type dépend d'une autre table), vérifié côté applicatif.

`wingId`/`harnessId`/`reserveId` (optionnels) : trois FK distinctes vers `Equipment` plutôt qu'une relation générique, même principe que `takeoffPointId`/`landingPointId` — chacune doit référencer un `Equipment` du bon `EquipmentType` (`wingId` → WING, `harnessId` → HARNESS, `reserveId` → RESERVE), vérifié côté applicatif (voir `docs/domain-model.md` > Règles métier > Matériel). `onDelete: Restrict` explicite : la suppression d'un `Equipment` encore référencé par un vol est bloquée, jamais silencieuse (voir Equipment ci-dessous).

---

### FlightType

Référentiel des types de vol (table, pas un enum : extensible sans migration, même principe qu'`ActivityType`).

Champs :

- id
- code (unique)

Pas de `label`, même principe que `ActivityType`/`SiteType`.

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

Relations :

- appartient à une Activity
- appartient à une School
- appartient à un TrainingCampType
- peut appartenir à un QualificationType (brevet obtenu pendant le stage)

Champs :

- startDate
- endDate
- observations (optionnel)
- summary (optionnel)

`qualificationTypeId` (optionnel) remplace l'ancien champ `certification`
(texte libre) : référence structurée vers `QualificationType`, affichage
résolu via `referenceLabels.qualificationType` plutôt qu'un texte saisi à la
main. Champ d'affichage propre au stage uniquement — sélectionner un brevet
ici ne crée jamais automatiquement de `Qualification` personnelle dans
`/qualifications` (décision explicite, pour ne pas dupliquer silencieusement
une donnée entre les deux endroits).

---

### TrainingCampType

Référentiel des types de stage (table, pas un enum : extensible sans migration, même principe qu'`ActivityType`/`SiteType`/`FlightType`). Remplace l'ancien champ `TrainingCamp.campType` (texte libre).

Champs :

- id
- code (unique)
- createdAt
- updatedAt

Pas de `label`, même principe que les autres tables de référence ci-dessus. Porte `createdAt`/`updatedAt` à la différence de celles-ci (demande explicite pour cette table).

Valeurs initiales (peuplées par le seed) :

- INITIATION
- AUTONOMY
- ADVANCED
- THERMAL
- CROSS_COUNTRY
- SIV
- HIKE_AND_FLY
- ACRO_DISCOVERY
- ACRO_ADVANCED
- SAFETY
- OTHER

---

### GroundHandlingSession

Spécialisation d'une Activity.

Relations :

- appartient à une Activity
- appartient à un Spot
- peut appartenir à un TrainingCamp
- peut référencer jusqu'à deux `Equipment` : `wing` (voile), `harness` (sellette)

Champs :

- date — porte aussi l'heure, même principe que `Flight.date`
- durationMin
- exercises
- difficulties (optionnel)
- feeling (optionnel)

`wingId`/`harnessId` (optionnels) : mêmes principes que `Flight.wingId`/`harnessId` ci-dessus (`onDelete: Restrict`). Pas de `reserveId` ici : un secours ne s'utilise/s'use pas pendant une séance de gonflage.

---

### Spot

Lieu de pratique. Référentiel éditorial (ADR 004, docs/decisions/004-editable-referentials.md) : destiné à une future gestion applicative, pas seulement au seed.

Champs :

- name
- region (optionnel)
- countryCode (optionnel) — code pays ISO 3166-1 alpha-2 (`FR`, `CH`, `IT`, `ES`...), pas du texte libre
- latitude (optionnel) — localisation approximative du spot
- longitude (optionnel)
- createdAt
- updatedAt

Pas de notion de "site principal" : un `Spot` ne référence aucun `Site` (voir ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md`, qui revient sur ce choix initialement décrit dans l'ADR 002 ; vocabulaire actuel `Spot`/`Site` voir ADR 007, `docs/decisions/007-site-spot-terminology-rename.md`).

---

### Site

Point physique précis appartenant à un Spot : décollage ou atterrissage, selon son `SiteType`. Un Spot peut avoir plusieurs `Site` d'un même `SiteType` ; aucun n'est désigné comme "principal" (voir ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md`). Référentiel éditorial (ADR 004, docs/decisions/004-editable-referentials.md), même principe que `Spot`/`School`.

Relations :

- appartient à un Spot
- appartient à un SiteType

Champs :

- label
- latitude, longitude (utilisation future dans une carte)
- altitudeM
- orientationDeg (optionnel)

Le type d'un `Site` (TAKEOFF/LANDING) détermine directement le rôle qu'il peut jouer dans un `Flight` : `takeoffPointId` doit référencer un site TAKEOFF, `landingPointId` un site LANDING (voir ADR 005).

---

### SiteType

Référentiel des types de site (table, pas un enum : extensible sans migration, même principe qu'`ActivityType`).

Champs :

- id
- code (unique)

Pas de `label`, même principe que `ActivityType`.

Valeurs initiales (peuplées par le seed) :

- TAKEOFF
- LANDING

---

### School

École fédérale de parapente. Référentiel éditorial (ADR 004, docs/decisions/004-editable-referentials.md), même principe que `Spot`.

Champs :

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

---

### Qualification

Brevet ou qualification de pilotage obtenu par un pilote (issue #171). À la
différence de `Flight`/`TrainingCamp`/`GroundHandlingSession`, ce n'est
**pas** une spécialisation d'`Activity` : rattachée directement à `User`,
elle n'apparaît pas dans la timeline `/activities` (un brevet est un statut
acquis, pas une session de pratique datée).

Relations :

- appartient à un User
- appartient à un QualificationType
- peut appartenir à une School (école qui l'a délivré)
- peut appartenir à un TrainingCamp (stage au cours duquel il a été obtenu)

Champs :

- obtainedDate (date sans heure)
- notes (optionnel)
- createdAt
- updatedAt

Suppression d'une School ou d'un TrainingCamp référencé : dissociation
(`onDelete: SetNull`), jamais suppression ni blocage — `schoolId` et
`trainingCampId` sont optionnels, même principe que
`Flight.trainingCampId`/`GroundHandlingSession.trainingCampId` (perdre le
lien ne doit jamais faire perdre le brevet déjà enregistré).

---

### QualificationType

Référentiel des types de brevet/qualification de pilotage (table, pas un
enum : extensible sans migration, même principe qu'`ActivityType`/
`SiteType`/`FlightType`/`TrainingCampType`).

Champs :

- id
- code (unique)

Pas de `label`, même principe que les autres tables de référence
ci-dessus. Alimenté par un seed dédié (`prisma/seed-qualification-types.ts`,
exécutable indépendamment du seed principal via
`pnpm --filter web prisma:seed:qualification-types`, pour pouvoir peupler
preview et production séparément), pas par le seed principal ni par une
interface admin.

Valeurs initiales :

- INITIATION
- PILOT
- CONFIRMED_PILOT
- TANDEM
- SIV
- INSTRUCTOR
- OTHER

---

### EquipmentType

Référentiel des catégories de matériel (table, pas un enum : extensible sans migration, même principe qu'`ActivityType`/`SiteType`/`FlightType`/`TrainingCampType`/`QualificationType`).

Champs :

- id
- code (unique)

Pas de `label`, même principe que les autres tables de référence ci-dessus.

Valeurs initiales (peuplées par le seed) :

- WING
- HARNESS
- RESERVE

---

### Equipment

Élément de matériel personnel d'un pilote (voile, sellette, secours). Donnée personnelle par utilisateur (`userId`), pas un référentiel partagé comme `Spot`/`Site`/`School` (ADR 004, docs/decisions/004-editable-referentials.md) : chaque pilote gère son propre matériel.

Relations :

- appartient à un User
- appartient à un EquipmentType
- référencé par des Flight (`wing`/`harness`/`reserve`) et des GroundHandlingSession (`wing`/`harness`)

Champs :

- brand
- model
- size (optionnel) — texte libre, le format varie selon la catégorie
- purchaseDate (date sans heure)
- condition (`NEW`/`USED`)
- initialUsageMin (0 par défaut) — volume de pratique accumulé avant l'achat, pertinent seulement si `condition = USED`
- status (`ACTIVE`/`SOLD`/`RETIRED`, défaut `ACTIVE`)
- createdAt
- updatedAt

Jamais supprimé une fois référencé par un `Flight`/`GroundHandlingSession` : suppression bloquée (`ReferenceDataInUseError`), même principe que `Spot`/`Site`/`School` (voir `docs/admin.md`) — `status = SOLD`/`RETIRED` est le moyen prévu de retirer un équipement de la circulation sans perdre son historique. Le volume total de pratique n'est jamais stocké, toujours recalculé (`initialUsageMin` + durées des vols/séances qui le référencent) — voir ADR 011 (`docs/decisions/011-equipment-usage-derived.md`).

---

## Relations

User 1,N Activity

User 1,N Session

User 1,N Account

Activity 1,1 ActivityType

Activity 1,0..1 Flight

Activity 1,0..1 TrainingCamp

Activity 1,0..1 GroundHandlingSession

Spot 1,N Site

SiteType 1,N Site

Site 1,N Flight (takeoffPoint)

Site 1,N Flight (landingPoint)

FlightType 1,N Flight

Spot 1,N GroundHandlingSession

TrainingCamp 1,N Flight

TrainingCamp 1,N GroundHandlingSession

School 1,N TrainingCamp

TrainingCampType 1,N TrainingCamp

QualificationType 0..1,N TrainingCamp

User 1,N Qualification

QualificationType 1,N Qualification

School 0..1,N Qualification

TrainingCamp 0..1,N Qualification

User 1,N Equipment

EquipmentType 1,N Equipment

Equipment 0..1,N Flight (wing)

Equipment 0..1,N Flight (harness)

Equipment 0..1,N Flight (reserve)

Equipment 0..1,N GroundHandlingSession (wing)

Equipment 0..1,N GroundHandlingSession (harness)