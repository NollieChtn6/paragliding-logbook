import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { equipmentSchema } from "@/lib/validations/equipment";
import type { Messages } from "@/messages";

// Equipment n'est pas une spécialisation d'Activity (donnée personnelle par
// pilote, voir schema.prisma) : pas de transaction Activity + spécialisation
// comme createFlight/createTrainingCamp, juste la vérification de
// equipmentTypeId avant la création. userId toujours résolu côté serveur,
// jamais fourni par le client. status non exposé ici : toujours ACTIVE par
// défaut à la création (voir lib/validations/equipment.ts).
export async function createEquipment(
  userId: string,
  rawInput: unknown,
  t: Messages["validation"]["equipment"],
) {
  const input = equipmentSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    // EquipmentType est une donnée de référence partagée, même traitement
    // que qualificationTypeId dans create-qualification.service.ts.
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

    return tx.equipment.create({
      data: {
        userId,
        equipmentTypeId: input.equipmentTypeId,
        brand: input.brand,
        model: input.model,
        size: input.size,
        purchaseDate: input.purchaseDate,
        condition: input.condition,
        initialUsageMin: input.initialUsageMin,
      },
    });
  });
}
