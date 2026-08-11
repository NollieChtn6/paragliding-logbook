# ADR 007 - Renommage de terminologie : Site → Spot, SitePoint → Site

## Contexte

Depuis l'ADR 002 (`docs/decisions/002-site-point-model.md`), le modèle distinguait `Site` (lieu général de pratique, ex. une station) et `SitePoint` (point de décollage/atterrissage précis rattaché à un site, avec coordonnées GPS). Ce vocabulaire ne correspond pas à l'usage réel du parapente : les pratiquants appellent « site » ce que l'application nommait `SitePoint` (le décollage ou l'atterrissage précis), et désignent par un terme plus proche de « spot » le lieu général que l'application appelait `Site`.

Ce décalage entre le vocabulaire du code/de l'interface et celui du terrain rendait l'application moins naturelle à utiliser et à faire évoluer (toute discussion sur le domaine devait mentalement traduire les deux vocabulaires).

## Décision

Renommage complet, en base comme dans le code, sans changement de comportement ni de structure de données au-delà des noms :

| Ancien nom | Nouveau nom |
|---|---|
| `Site` (lieu général) | `Spot` |
| `SitePoint` (décollage/atterrissage précis) | `Site` |
| `SitePointType` | `SiteType` |

- Renommage en base via migration `RENAME TABLE`/`RENAME COLUMN`/`RENAME CONSTRAINT`/`RENAME INDEX` (pas de `DROP`/`CREATE`) : les données existantes sont préservées, aucune perte.
- Renommage à l'identique du schéma Prisma, des services (`features/spots/`, `features/sites/`), des actions, des validations Zod, du seeder, des tests et de toutes les interfaces (formulaires, admin, carte).
- `Flight.takeoffPointId`/`landingPointId` (ADR 005) ne contenaient déjà pas le mot « site » : seul leur type cible change (`SitePoint` → `Site`), aucun renommage de champ nécessaire.
- `GroundHandlingSession` référence toujours le lieu général directement (pas un point précis) — choix assumé depuis l'ADR 002/005, désormais exprimé comme `GroundHandlingSession.spotId` → `Spot`.
- Livré en une seule PR atomique : le code ne peut pas compiler dans un état intermédiaire mêlant ancien et nouveau vocabulaire.
- Les ADR 002/004/005, qui documentent des décisions passées sous l'ancien vocabulaire, restent inchangées (compte-rendu historique, conformément à la note déjà présente dans l'ADR 002). `docs/domain-model.md`, doc vivante, est mise à jour avec le nouveau vocabulaire.

## Conséquences

Avantages :

- le vocabulaire du code, de la base et de l'interface correspond désormais à celui des pratiquants — plus besoin de traduire mentalement entre les deux ;
- aucune perte de données (migration par renommage uniquement, vérifiée par comparaison des comptes de lignes avant/après) ;
- aucun changement de structure ou de comportement : le risque de régression fonctionnelle est limité à des erreurs de renommage, pas à une refonte du modèle.

Inconvénients :

- renommage transversal sur un grand nombre de fichiers (schéma, ~30 fichiers backend, routes admin, formulaires, carte) : surface de revue large pour une PR qui ne change aucun comportement ;
- toute documentation externe ou notes personnelles utilisant l'ancien vocabulaire (Site = lieu général) devient obsolète ;
- les ADR 002/004/005 restent lisibles avec l'ancien vocabulaire (`Site`/`SitePoint`) : leur lecture nécessite de garder cette ADR en tête pour faire la correspondance avec le code actuel.
