# ADR 003 - Tables de référence : code seul, labels en couche applicative

## Contexte

`ActivityType` et `SitePointType` étaient des tables de référence (`id`, `code`, `label`) stockant un libellé français en base. `FlightType` était un enum Prisma (`LOCAL`, `CROSS`, `SOARING`, `THERMAL`, `TRAINING`, `OTHER`), donc ni table ni traduisible.

Ces trois référentiels partagent la même nature : un petit ensemble de **catégories techniques**, stables, connues à l'avance, dont le libellé affiché est amené à être traduit si l'application supporte plusieurs langues. Stocker un libellé figé en base pour ce type de donnée pose deux problèmes : changer une formulation ou ajouter une langue nécessite une migration/mise à jour de données, et rien ne distingue ces `label` de ceux d'une donnée éditoriale (ex. `Site.name`, `SitePoint.label`, `School.name`), qui eux sont bien des données métier saisies par l'utilisateur et doivent rester en base.

## Décision

- `ActivityType`, `SitePointType` : `label` retiré. Ne conservent que `id` et `code` (unique).
- `FlightType` : converti d'enum Prisma en table de référence, même principe (`id`, `code`, pas de `label`). Valeur `CROSS` renommée en `CROSS_COUNTRY` à cette occasion (plus explicite).
- `code` en `UPPER_SNAKE_CASE` : convention déjà utilisée par les enums Prisma existants, stable et directement exploitable comme clé d'un dictionnaire TypeScript ou d'un futur catalogue i18n.
- Les libellés affichés vivent dans `apps/web/src/lib/reference-labels.ts`, sous forme de dictionnaires plats `Record<code, label>` (`ACTIVITY_TYPE_LABELS`, `SITE_POINT_TYPE_LABELS`, `FLIGHT_TYPE_LABELS`), consultés par `code`. Cette structure est délibérément alignée sur ce que prendrait une future clé de traduction (`activityTypes.FLIGHT`, `flightTypes.CROSS_COUNTRY`) sans introduire de dépendance i18n avant qu'elle soit nécessaire.
- Chaque consultation du dictionnaire retombe sur le `code` brut si absent (`LABELS[code] ?? code`), pour ne jamais afficher un écran vide si une valeur de référence est ajoutée en base sans mise à jour immédiate du dictionnaire.
- Cette règle ne s'applique **pas** aux données éditoriales (`Site.name`, `SitePoint.label`, `School.name`) : ce sont des données métier saisies par l'utilisateur, pas des catégories techniques, elles restent en base sans équivalent.

## Conséquences

Avantages :

- changer une formulation ou ajouter une langue ne touche plus qu'un fichier TypeScript, pas de migration ni de mise à jour de données ;
- séparation claire entre identifiant stable (`code`, utilisé dans le code et les validations) et présentation (`label`, couche UI) ;
- `FlightType` devient extensible sans migration, comme `ActivityType`/`SitePointType` (cohérence des trois référentiels).

Inconvénients :

- un dictionnaire TypeScript à maintenir en plus des seeds, avec le risque d'un `code` présent en base sans entrée correspondante dans le dictionnaire (mitigé par le fallback `?? code`) ;
- migration en deux temps pour `FlightType` (colonne texte intermédiaire, backfill, puis `NOT NULL` + suppression de l'ancienne colonne) pour passer d'un enum à une table sans perdre les données existantes ;
- renommage de `CROSS` en `CROSS_COUNTRY` : rupture de compatibilité avec toute donnée externe qui utiliserait encore l'ancien code (aucune connue à ce jour, données de test uniquement).
