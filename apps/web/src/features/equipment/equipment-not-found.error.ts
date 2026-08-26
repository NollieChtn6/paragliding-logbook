// Levée par updateEquipment/deleteEquipment quand le matériel ciblé
// n'existe pas ou n'appartient pas à l'utilisateur courant. Même posture que
// QualificationNotFoundError (features/qualifications) : ne jamais
// distinguer les deux cas côté appelant, pour ne pas laisser fuiter
// l'existence d'un matériel qui n'est pas le sien.
export class EquipmentNotFoundError extends Error {
  constructor() {
    super("Matériel introuvable.");
    this.name = "EquipmentNotFoundError";
  }
}
