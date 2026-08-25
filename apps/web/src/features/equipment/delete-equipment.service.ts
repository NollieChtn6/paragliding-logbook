import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { EquipmentNotFoundError } from "./equipment-not-found.error";
import {
  flightEquipmentReferenceWhere,
  groundHandlingSessionEquipmentReferenceWhere,
} from "./equipment-reference-where";

// Vérification de propriété d'abord (même principe que
// deleteQualification/updateEquipment) : un matériel n'appartenant pas à
// userId doit être traité comme inexistant, avant même de vérifier s'il est
// encore utilisé. Puis blocage si référencé par un Flight (wingId/harnessId/
// reserveId) ou une GroundHandlingSession (wingId/harnessId) — même
// mécanisme que delete-school.service.ts (ReferenceDataInUseError), pour ne
// jamais perdre l'historique d'usage d'un équipement encore utilisé
// (docs/domain-model.md > Règles métier > Matériel). Contrairement à
// School/Site/Spot (référentiels partagés gérés depuis /admin), Equipment
// est une donnée personnelle : premier usage de ReferenceDataInUseError en
// dehors des services admin (voir reference-data-in-use.error.ts).
export async function deleteEquipment(
  userId: string,
  equipmentId: string,
  equipmentInUseMessage: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.equipment.findFirst({
      where: { id: equipmentId, userId },
    });
    if (!existing) {
      throw new EquipmentNotFoundError();
    }

    const [flightCount, groundHandlingSessionCount] = await Promise.all([
      tx.flight.count({ where: flightEquipmentReferenceWhere(equipmentId) }),
      tx.groundHandlingSession.count({
        where: groundHandlingSessionEquipmentReferenceWhere(equipmentId),
      }),
    ]);

    if (flightCount > 0 || groundHandlingSessionCount > 0) {
      throw new ReferenceDataInUseError(equipmentInUseMessage);
    }

    await tx.equipment.delete({ where: { id: equipmentId } });
  });
}
