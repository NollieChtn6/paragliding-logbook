# ADR 005 - Flight référence directement un takeoffPoint et un landingPoint

## Contexte

Depuis l'ADR 002 (`docs/decisions/002-site-point-model.md`), `Site` portait `primaryTakeoffPointId`/`primaryLandingPointId` (un point "principal" par site), et `Flight` référençait `departurePointId`/`arrivalPointId` : deux rôles génériques, sans contrainte de type — n'importe quel `SitePoint`, quel que soit son `SitePointType`, pouvait servir de départ ou d'arrivée.

Deux limites en pratique :

- la notion de point principal n'apportait rien : le formulaire de vol doit permettre de choisir *lequel* des points du site sert de décollage, la présélection d'un "principal" ne simplifie pas ce choix et ajoute un champ à maintenir sans UI de gestion des sites ;
- l'absence de contrainte de type sur `departurePointId`/`arrivalPointId` permettait des vols incohérents (un point normalement utilisé comme atterrissage sélectionné comme décollage), sans qu'aucune vérification ne l'empêche.

## Décision

- `Site` perd `primaryTakeoffPointId`/`primaryLandingPointId` et les relations associées. Un site est un lieu général de pratique, sans point désigné.
- `Flight.departurePointId`/`arrivalPointId` deviennent `Flight.takeoffPointId`/`landingPointId`. Le nom du champ porte directement la contrainte de type attendue :
  - `takeoffPointId` doit référencer un `SitePoint` dont le `SitePointType.code` est `TAKEOFF` ;
  - `landingPointId` doit référencer un `SitePoint` dont le `SitePointType.code` est `LANDING`.
- Cette contrainte n'est pas exprimable en SQL/Prisma (une FK ne peut pas conditionner la ligne cible sur une colonne d'une table tierce) : elle est vérifiée dans la couche service (`create-flight.service.ts`/`update-flight.service.ts`), au même endroit que les vérifications d'existence déjà en place pour `SitePoint`/`FlightType`/`TrainingCamp`.
- Aucune contrainte ne lie `takeoffPoint` et `landingPoint` au même `Site` : un vol de cross peut décoller d'un site et atterrir sur un autre, potentiellement plus haut que le décollage (inchangé depuis l'ADR 002).
- Sélection dans le formulaire : recherche serveur par nom (deux champs distincts, visuellement différenciés, filtrés par type), plutôt qu'un chargement de la liste complète des points — anticipe la croissance du référentiel sans complexifier l'implémentation actuelle (pas de recherche plein texte, juste `contains` insensible à la casse).

## Conséquences

Avantages :

- un `Flight` ne peut plus référencer un point du mauvais type : la contrainte métier est vérifiée à la création/modification, pas seulement documentée ;
- `Site` redevient un simple lieu général, sans champ à synchroniser manuellement avec ses `SitePoint` ;
- la recherche serveur évite de charger tous les points dès qu'un site a un référentiel de points important, tout en restant une implémentation simple (MVP).

Inconvénients :

- migration de données : `departurePointId`/`arrivalPointId` existants copiés vers `takeoffPointId`/`landingPointId` en une seule migration (vérifié au préalable que toutes les lignes existantes respectaient déjà la nouvelle contrainte de type — aucune donnée ambiguë à signaler) ;
- un même `SitePoint` ne peut plus servir à la fois de décollage et d'atterrissage d'un vol (conséquence directe de la contrainte de type, un point n'a qu'un seul `SitePointType`) — comportement qui était permis avant cette ADR ;
- la recherche par nom reste une implémentation minimale (pas de tri par proximité géographique, pas de pagination au-delà d'une limite fixe) : suffisant pour le volume de points actuel, à revisiter si le référentiel grossit significativement.
