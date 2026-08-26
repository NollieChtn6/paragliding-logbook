// Levée par les services de suppression quand l'entité ciblée est encore
// référencée par une autre donnée : jamais de suppression en cascade
// silencieuse, la suppression est bloquée avec un message clair plutôt que
// d'entraîner la perte de données utilisateur. Utilisée par les services de
// suppression admin (features/spots, features/sites, features/schools —
// docs/admin.md > Suppression) sur des référentiels partagés, et par
// features/equipment (delete-equipment.service.ts) sur une donnée
// personnelle par utilisateur : le mécanisme n'est pas propre à /admin.
export class ReferenceDataInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferenceDataInUseError";
  }
}
