# ADR 002 - Modèle Site / SitePoint pour les vols

## Contexte

`Flight` référençait un `Site` unique (`Flight.siteId`) avec ses propres `takeoffAltitudeM`/`landingAltitudeM`. Ce modèle ne permettait pas de représenter précisément un point de décollage/atterrissage (coordonnées GPS, orientation), ni un vol dont le départ et l'arrivée appartiennent à des sites différents (ex. vol de cross qui atterrit sur le décollage d'un autre site).

## Décision

- `SitePoint` : point physique rattaché à un `Site` (label, coordonnées GPS, altitude, orientation optionnelle). Un site peut avoir plusieurs points d'un même type.
- `SitePointType` : table de référence (`TAKEOFF`, `LANDING`), pas un enum Prisma — même principe qu'`ActivityType`, extensible sans migration.
- `Site.primaryTakeoffPointId`/`primaryLandingPointId` : désignent le point principal du site, nullable (pas d'UI de gestion des sites pour l'instant).
- `Flight.departurePointId`/`arrivalPointId` remplacent `Flight.siteId`, `takeoffAltitudeM`, `landingAltitudeM`. Aucune contrainte ne lie départ et arrivée au même site, ni ne compare leurs altitudes : un point de type TAKEOFF peut être utilisé comme point d'arrivée d'un vol, potentiellement plus haut que le départ.
- `GroundHandlingSession` garde `siteId` par choix assumé : une séance de gonflage n'a pas de notion de départ/arrivée, et l'éventuel besoin de précision GPS pour cette activité sera traité séparément si nécessaire (pas un oubli).

## Conséquences

Avantages :

- représentation précise du lieu (coordonnées, altitude, orientation), réutilisable pour une future carte
- pas de duplication de l'altitude entre `Site`/`Flight`
- modèle correct pour les vols de cross (départ/arrivée sur des sites différents)

Inconvénients :

- deux relations nommées supplémentaires sur `Flight` et deux sur `Site` (complexité de schéma)
- la contrainte "point principal du bon site et du bon type" n'est pas exprimable nativement en Postgres/Prisma, à vérifier côté applicatif
- incohérence temporaire avec `GroundHandlingSession`, qui référence toujours `Site` directement
- sans interface de gestion des sites/points, la création de nouveaux points reste seedée manuellement
