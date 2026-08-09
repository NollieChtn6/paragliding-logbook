// Levée par les services updateX (features/flights, training-camps,
// ground-handling-sessions) quand l'activité ciblée n'existe pas ou
// n'appartient pas à l'utilisateur courant. Même posture que
// getActivityById : ne jamais distinguer les deux cas côté appelant, pour ne
// pas laisser fuiter l'existence d'une activité qui n'est pas la sienne.
export class ActivityNotFoundError extends Error {
  constructor() {
    super("Activité introuvable.");
    this.name = "ActivityNotFoundError";
  }
}
