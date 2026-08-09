// Levée par les services de suppression admin (features/sites,
// features/site-points, features/schools) quand l'entité ciblée est encore
// référencée par une autre donnée (docs/admin.md > Suppression) : jamais de
// suppression en cascade silencieuse, la suppression est bloquée avec un
// message clair plutôt que d'entraîner la perte de données utilisateur.
export class ReferenceDataInUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferenceDataInUseError";
  }
}
