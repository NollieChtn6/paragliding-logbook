# Domain rules

## Activity

- Une Activity possède exactement une spécialisation.
- Le type d'activité doit correspondre à la spécialisation.

Pas encore vérifié par du code (`apps/web/src/lib/validations/activity.ts` est une structure vide pour l'instant).

## Flight

Implémenté et testé (`apps/web/src/lib/validations/flight.ts`) :

- la durée doit être strictement positive ;
- les observations et points d'amélioration sont obligatoires ;
- la date du vol ne peut pas être dans le futur ;
- un vol peut être rattaché à un stage (optionnel), la date du vol doit alors être comprise dans l'intervalle du stage.

Pas de règle comparant les altitudes de décollage/atterrissage : retirée depuis l'évolution Spot/Site (ADR 005, `docs/decisions/005-flight-takeoff-landing-points.md`), takeoffPoint et landingPoint peuvent appartenir à des spots différents (ex. vol de cross qui atterrit sur le décollage d'un autre spot, potentiellement plus haut).

Liste complète et à jour des règles métier (Vol, Stage, Gonflage, Qualification, Matériel, Suppression) : voir `docs/domain-model.md` > Règles métier, seule source tenue à jour au fil des évolutions — ce document-ci ne duplique plus cette liste pour éviter qu'elle ne diverge à nouveau.
