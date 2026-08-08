import { prisma } from "@/lib/prisma";
import { trainingCampSchema } from "@/lib/validations/training-camp";

const TRAINING_CAMP_ACTIVITY_TYPE_CODE = "TRAINING_CAMP";

// Même structure que createFlight (features/flights/create-flight.service.ts) :
// couche métier indépendante de l'UI, Activity toujours créée avant sa
// spécialisation dans la même transaction (docs/decisions/001-activity-model.md).
export async function createTrainingCamp(userId: string, rawInput: unknown) {
  const input = trainingCampSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const activityType = await tx.activityType.findUniqueOrThrow({
      where: { code: TRAINING_CAMP_ACTIVITY_TYPE_CODE },
    });

    const activity = await tx.activity.create({
      data: {
        userId,
        activityTypeId: activityType.id,
      },
    });

    return tx.trainingCamp.create({
      data: {
        activityId: activity.id,
        schoolId: input.schoolId,
        campType: input.campType,
        startDate: input.startDate,
        endDate: input.endDate,
        summary: input.summary,
        certification: input.certification,
      },
    });
  });
}
