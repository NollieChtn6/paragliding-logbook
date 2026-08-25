import { ZodError, type ZodIssue } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { prisma } from "@/lib/prisma";
import { trainingCampSchema } from "@/lib/validations/training-camp";
import type { Messages } from "@/messages";

// Même structure que createTrainingCamp (create-training-camp.service.ts).
// Pas de règle métier cross-entité supplémentaire ici : trainingCampSchema
// vérifie déjà startDate <= endDate. La règle "les vols/séances associés
// doivent rester dans l'intervalle du stage" n'est pas revérifiée
// rétroactivement lors d'une modification (hors périmètre actuel).
export async function updateTrainingCamp(
  userId: string,
  activityId: string,
  rawInput: unknown,
  t: Messages["validation"]["trainingCamp"],
) {
  const input = trainingCampSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findFirst({ where: { id: activityId, userId } });
    if (!activity) {
      throw new ActivityNotFoundError();
    }

    // TrainingCampType est une donnée de référence partagée, même traitement
    // que dans createTrainingCamp ci-dessus.
    const trainingCampType = await tx.trainingCampType.findUnique({
      where: { id: input.trainingCampTypeId },
    });
    if (!trainingCampType) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["trainingCampTypeId"],
        message: t.typeNotFound,
      };
      throw new ZodError([issue]);
    }

    // QualificationType est aussi une donnée de référence partagée, même
    // traitement que dans createTrainingCamp ci-dessus.
    if (input.qualificationTypeId) {
      const qualificationType = await tx.qualificationType.findUnique({
        where: { id: input.qualificationTypeId },
      });
      if (!qualificationType) {
        const issue: ZodIssue = {
          code: "custom",
          path: ["qualificationTypeId"],
          message: t.certificationNotFound,
        };
        throw new ZodError([issue]);
      }
    }

    return tx.trainingCamp.update({
      where: { activityId },
      data: {
        schoolId: input.schoolId,
        trainingCampTypeId: input.trainingCampTypeId,
        startDate: input.startDate,
        endDate: input.endDate,
        // ?? null : un update Prisma ignore les champs undefined au lieu de
        // les effacer, contrairement à create — nécessaire pour permettre de
        // vider les observations/le bilan/le brevet obtenu.
        observations: input.observations ?? null,
        summary: input.summary ?? null,
        qualificationTypeId: input.qualificationTypeId ?? null,
      },
    });
  });
}
