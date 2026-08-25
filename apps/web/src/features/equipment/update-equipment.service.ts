import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { updateEquipmentSchema } from "@/lib/validations/equipment";
import type { Messages } from "@/messages";
import { EquipmentNotFoundError } from "./equipment-not-found.error";
import {
  flightEquipmentReferenceWhere,
  groundHandlingSessionEquipmentReferenceWhere,
} from "./equipment-reference-where";

// Même structure que updateQualification, avec vérification de propriété
// systématique : un matériel n'appartenant pas à userId doit être traité
// comme inexistant. status modifiable ici (à la différence de
// createEquipment) : c'est le formulaire de modification qui permet de
// retirer un équipement de la circulation (ACTIVE/SOLD/RETIRED), voir
// lib/validations/equipment.ts.
export async function updateEquipment(
  userId: string,
  equipmentId: string,
  rawInput: unknown,
  t: Messages["validation"]["equipment"],
) {
  const input = updateEquipmentSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.equipment.findFirst({
      where: { id: equipmentId, userId },
    });
    if (!existing) {
      throw new EquipmentNotFoundError();
    }

    const equipmentType = await tx.equipmentType.findUnique({
      where: { id: input.equipmentTypeId },
    });
    if (!equipmentType) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["equipmentTypeId"],
        message: t.typeNotFound,
      };
      throw new ZodError([issue]);
    }

    // Changer la catégorie d'un Equipment déjà référencé casserait
    // silencieusement l'invariant "wingId pointe vers un Equipment de type
    // WING" (etc.) sur les Flight/GroundHandlingSession existants qui le
    // référencent encore — non revérifié après coup, contrairement à la
    // création (docs/domain-model.md > Règles métier > Matériel). Bloqué
    // uniquement quand la catégorie change réellement : un update qui la
    // laisse identique ne présente aucun risque.
    if (input.equipmentTypeId !== existing.equipmentTypeId) {
      const [flightCount, groundHandlingSessionCount] = await Promise.all([
        tx.flight.count({ where: flightEquipmentReferenceWhere(equipmentId) }),
        tx.groundHandlingSession.count({
          where: groundHandlingSessionEquipmentReferenceWhere(equipmentId),
        }),
      ]);
      if (flightCount > 0 || groundHandlingSessionCount > 0) {
        const issue: ZodIssue = {
          code: "custom",
          path: ["equipmentTypeId"],
          message: t.typeChangeBlocked,
        };
        throw new ZodError([issue]);
      }
    }

    return tx.equipment.update({
      where: { id: equipmentId },
      data: {
        equipmentTypeId: input.equipmentTypeId,
        brand: input.brand,
        model: input.model,
        // ?? null : un update Prisma ignore les champs undefined au lieu de
        // les effacer, contrairement à create (même principe que
        // update-qualification.service.ts pour schoolId/trainingCampId).
        size: input.size ?? null,
        purchaseDate: input.purchaseDate,
        condition: input.condition,
        initialUsageMin: input.initialUsageMin,
        status: input.status,
      },
    });
  });
}
