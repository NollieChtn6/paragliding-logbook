import { prisma } from "@/lib/prisma";
import {
  flightEquipmentReferenceWhere,
  groundHandlingSessionEquipmentReferenceWhere,
} from "./equipment-reference-where";

export type EquipmentStats = {
  flightCount: number;
  groundHandlingSessionCount: number;
};

// Compteurs affichés sur /equipment/[id] : agrégations dédiées côté base
// (mêmes prédicats que get-equipment-usage.service.ts), pas un recomptage
// en mémoire sur une liste déjà chargée.
export async function getEquipmentStats(equipmentId: string): Promise<EquipmentStats> {
  const [flightCount, groundHandlingSessionCount] = await Promise.all([
    prisma.flight.count({ where: flightEquipmentReferenceWhere(equipmentId) }),
    prisma.groundHandlingSession.count({
      where: groundHandlingSessionEquipmentReferenceWhere(equipmentId),
    }),
  ]);

  return { flightCount, groundHandlingSessionCount };
}
