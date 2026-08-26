// Prédicats Prisma partagés pour "cet Equipment est encore référencé par une
// activité" — une seule définition, réutilisée partout où cette question se
// pose (delete-equipment.service.ts : bloque la suppression ;
// get-equipment-usage.service.ts : somme les durées ; update-equipment.service.ts :
// bloque le changement de catégorie) pour qu'aucun de ces usages ne puisse
// dériver silencieusement des autres si un futur type de rattachement
// s'ajoute (docs/domain-model.md > Règles métier > Matériel).
export function flightEquipmentReferenceWhere(equipmentId: string) {
  return {
    OR: [{ wingId: equipmentId }, { harnessId: equipmentId }, { reserveId: equipmentId }],
  };
}

// Pas de reserveId ici : un secours ne s'utilise pas pendant une séance de
// gonflage (docs/domain-model.md).
export function groundHandlingSessionEquipmentReferenceWhere(equipmentId: string) {
  return { OR: [{ wingId: equipmentId }, { harnessId: equipmentId }] };
}
