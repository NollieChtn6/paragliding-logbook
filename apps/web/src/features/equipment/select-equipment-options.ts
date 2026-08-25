import type { EquipmentListItem } from "./list-equipment.service";

export type EquipmentSelectOption = {
  id: string;
  brand: string;
  model: string;
  size: string | null;
};

// Options proposées dans un sélecteur de matériel (FlightForm/
// GroundHandlingSessionForm, voir wingId/harnessId/reserveId) : matériel
// ACTIVE du type demandé, plus l'élément déjà sélectionné même si son statut
// a changé depuis (docs/domain-model.md > Règles métier > Matériel) — pour
// ne pas faire disparaître silencieusement, en rouvrant un vol/séance déjà
// enregistré pour modification, un matériel désormais vendu/retiré qu'il
// référence encore. Fonction pure, indépendante de Prisma/React (même
// principe que dashboard-stats.ts) : opère sur une liste déjà chargée par
// listEquipment.
export function selectEquipmentOptions(
  equipment: EquipmentListItem[],
  typeCode: "WING" | "HARNESS" | "RESERVE",
  selectedId?: string,
): EquipmentSelectOption[] {
  return equipment
    .filter(
      (item) =>
        item.equipmentType.code === typeCode &&
        (item.status === "ACTIVE" || item.id === selectedId),
    )
    .map((item) => ({ id: item.id, brand: item.brand, model: item.model, size: item.size }));
}

// Libellé affiché pour une EquipmentSelectOption dans un <Select> (voir
// FlightForm/GroundHandlingSessionForm) : une seule définition partagée par
// les deux formulaires, pour ne pas risquer une dérive entre "brand model
// (size)" et une variante subtilement différente si le format change un jour.
export function formatEquipmentOption(equipment: EquipmentSelectOption): string {
  return equipment.size
    ? `${equipment.brand} ${equipment.model} (${equipment.size})`
    : `${equipment.brand} ${equipment.model}`;
}
