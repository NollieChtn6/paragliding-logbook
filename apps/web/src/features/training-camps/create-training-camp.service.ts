import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { trainingCampSchema } from "@/lib/validations/training-camp";
import type { Messages } from "@/messages";

const TRAINING_CAMP_ACTIVITY_TYPE_CODE = "TRAINING_CAMP";

// Même structure que createFlight (features/flights/create-flight.service.ts) :
// couche métier indépendante de l'UI, Activity toujours créée avant sa
// spécialisation dans la même transaction (docs/decisions/001-activity-model.md).
export async function createTrainingCamp(
  userId: string,
  rawInput: unknown,
  t: Messages["validation"]["trainingCamp"],
) {
  const input = trainingCampSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const activityType = await tx.activityType.findUniqueOrThrow({
      where: { code: TRAINING_CAMP_ACTIVITY_TYPE_CODE },
    });

    // TrainingCampType est une donnée de référence partagée, même traitement
    // que FlightType (docs/decisions/003-reference-table-codes.md).
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
        trainingCampTypeId: input.trainingCampTypeId,
        startDate: input.startDate,
        endDate: input.endDate,
        observations: input.observations,
        summary: input.summary,
        certification: input.certification,
      },
    });
  });
}
