# Domain rules

## Activity

- Une Activity possède exactement une spécialisation.
- Le type d'activité doit correspondre à la spécialisation.

Pas encore vérifié par du code (`apps/web/src/lib/validations/activity.ts` est une structure vide pour l'instant).

## Flight

Implémenté et testé (`apps/web/src/lib/validations/flight.ts`) :

- la durée doit être strictement positive ;
- l'altitude de décollage doit être supérieure à l'altitude d'atterrissage ;
- les observations et points d'amélioration sont obligatoires ;
- la date du vol ne peut pas être dans le futur ;
- un vol peut être rattaché à un stage (optionnel).
