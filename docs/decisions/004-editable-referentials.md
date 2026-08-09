# ADR 004 - Référentiels éditables : School et Site enrichis, distinction avec les tables techniques

## Contexte

`School` était trop minimal (`name`, `website`, `location` en texte libre) et `Site.country` était aussi du texte libre non structuré. Aucun des deux n'est exploitable pour un futur affichage ou tri par pays, et rien ne distinguait ces référentiels des tables de référence techniques (`ActivityType`, `FlightType`, `SitePointType`, ADR 003) alors qu'ils sont de nature différente : `School`, `Site` et `SitePoint` sont des données du monde réel (nom d'une école, d'un site de vol), pas des catégories techniques traduisibles.

## Décision

### Distinction référentiel technique / référentiel éditorial

- **Référentiels techniques** (`ActivityType`, `FlightType`, `SitePointType`, ADR 003) : ensemble fermé de catégories connues à l'avance, `id` + `code` uniquement, gérés par migration + seed, jamais modifiables depuis l'application. Le libellé affiché vit en dehors de la base (`apps/web/src/lib/reference-labels.ts`).
- **Référentiels éditoriaux** (`School`, `Site`, `SitePoint`) : données métier réelles (nom d'une école, d'un site, d'un point de décollage), saisies et modifiables au cas par cas, pas un ensemble fermé de catégories. `Site.name`, `SitePoint.label`, `School.name` restent des données métier en base, jamais des codes (ADR 003 le précisait déjà). Cette PR prépare ces trois entités à une future gestion applicative (création/modification depuis l'interface), sans construire cette interface elle-même — structure propre et extensible, pas de champ calculé/dérivé.

### Codes pays ISO

`Site.country` et `School` (nouveau) utilisent un `countryCode String? @db.Char(2)` : code ISO 3166-1 alpha-2 (`FR`, `CH`, `IT`, `ES`...), pas un nom de pays en texte libre. L'affichage du nom complet du pays à partir du code sera géré côté interface le jour où c'est nécessaire (même logique que les libellés des référentiels techniques, ADR 003 : le code est stable et stocké, la présentation est une préoccupation UI).

### School enrichi

Nouveaux champs `address`, `postalCode`, `city`, `countryCode`, `latitude`, `longitude` (tous optionnels), `website` conservé, `location` (texte libre) supprimé.

Migration des données existantes (`location` → nouveaux champs) : `location` contenait en pratique un nom de commune (vérifié sur les données réelles : `"Annecy"`, `"Saint-Hilaire-du-Touvet"`) — copié tel quel dans `city`, le champ structuré le plus proche. `address`/`postalCode`/`countryCode` ne sont pas déductibles automatiquement d'un texte libre non structuré : laissés `NULL` plutôt que devinés, conformément au principe "ne jamais perdre de donnée, mais ne jamais inventer non plus" — un utilisateur pourra les compléter manuellement le jour où l'interface de gestion existera.

### Site

`country` (texte libre) renommé `countryCode` (`@db.Char(2)`), même convention que `School`. Aucune ligne existante n'avait de valeur non nulle pour `country` ; la migration documente néanmoins un mapping (France→FR, Suisse/Switzerland→CH, Italie/Italy→IT, Espagne/Spain→ES) pour toute donnée future, avec repli sur `NULL` si non reconnu.

## Conséquences

Avantages :

- champs structurés (adresse, code pays) exploitables pour un futur tri/affichage/carte, sans perdre les données existantes ;
- convention `countryCode` cohérente entre `Site` et `School` ;
- distinction explicite entre référentiel technique (ADR 003) et référentiel éditorial, qui clarifie où va un futur champ : un `code` UPPER_SNAKE_CASE pour une catégorie fermée, un champ métier normal pour une donnée éditoriale ;
- pas d'interface de gestion construite prématurément (hors périmètre de cette PR) : le schéma est prêt, l'implémentation viendra à la demande.

Inconvénients :

- `address`/`postalCode`/`countryCode` restent `NULL` pour les écoles existantes dont seul `location` était renseigné (pas de perte de données, mais pas de complétion automatique non plus) ;
- un `Site`/`School` reste modifiable uniquement par accès direct à la base ou script (`prisma/seed.ts`) tant que l'interface de gestion n'existe pas.
