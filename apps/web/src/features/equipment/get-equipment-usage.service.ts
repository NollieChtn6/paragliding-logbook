import { prisma } from "@/lib/prisma";
import {
  flightEquipmentReferenceWhere,
  groundHandlingSessionEquipmentReferenceWhere,
} from "./equipment-reference-where";

type EquipmentUsageInput = { id: string; initialUsageMin: number };

// Volume total de pratique d'un Equipment : initialUsageMin + somme des
// durées des Flight/GroundHandlingSession qui le référencent — jamais
// stocké, toujours recalculé à la demande (ADR 010,
// docs/decisions/010-equipment-usage-derived.md). Agrégations dédiées côté
// base (même principe que flight-totals.service.ts), pas un calcul en
// mémoire sur une liste déjà chargée (dashboard-stats.ts) : la page
// /equipment n'a pas déjà listActivities en mémoire. Prend l'Equipment déjà
// chargé par l'appelant (listEquipment/getEquipment, qui vérifient déjà la
// propriété) plutôt que de le relire par id, pour éviter une requête
// redondante.
export async function getEquipmentUsageMinutes(equipment: EquipmentUsageInput): Promise<number> {
  const [flightAggregate, groundHandlingAggregate] = await Promise.all([
    prisma.flight.aggregate({
      where: flightEquipmentReferenceWhere(equipment.id),
      _sum: { durationMin: true },
    }),
    prisma.groundHandlingSession.aggregate({
      where: groundHandlingSessionEquipmentReferenceWhere(equipment.id),
      _sum: { durationMin: true },
    }),
  ]);

  return (
    equipment.initialUsageMin +
    (flightAggregate._sum.durationMin ?? 0) +
    (groundHandlingAggregate._sum.durationMin ?? 0)
  );
}
