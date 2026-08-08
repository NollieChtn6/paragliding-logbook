import { ActivityNotFoundError } from "@/features/activities";
import { prisma } from "@/lib/prisma";
import { trainingCampSchema } from "@/lib/validations/training-camp";

// Même structure que createTrainingCamp (create-training-camp.service.ts).
// Pas de règle métier cross-entité supplémentaire ici : trainingCampSchema
// vérifie déjà startDate <= endDate. La règle "les vols/séances associés
// doivent rester dans l'intervalle du stage" n'est pas revérifiée
// rétroactivement lors d'une modification (hors périmètre actuel).
export async function updateTrainingCamp(userId: string, activityId: string, rawInput: unknown) {
  const input = trainingCampSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findFirst({ where: { id: activityId, userId } });
    if (!activity) {
      throw new ActivityNotFoundError();
    }

    return tx.trainingCamp.update({
      where: { activityId },
      data: {
        schoolId: input.schoolId,
        campType: input.campType,
        startDate: input.startDate,
        endDate: input.endDate,
        // ?? null : un update Prisma ignore les champs undefined au lieu de
        // les effacer, contrairement à create — nécessaire pour permettre de
        // vider le bilan/la certification.
        summary: input.summary ?? null,
        certification: input.certification ?? null,
      },
    });
  });
}
