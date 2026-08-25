// Levée par updateQualification/deleteQualification quand le brevet ciblé
// n'existe pas ou n'appartient pas à l'utilisateur courant. Même posture que
// ActivityNotFoundError (features/activities) : ne jamais distinguer les
// deux cas côté appelant, pour ne pas laisser fuiter l'existence d'un
// brevet qui n'est pas le sien.
export class QualificationNotFoundError extends Error {
  constructor() {
    super("Brevet introuvable.");
    this.name = "QualificationNotFoundError";
  }
}
