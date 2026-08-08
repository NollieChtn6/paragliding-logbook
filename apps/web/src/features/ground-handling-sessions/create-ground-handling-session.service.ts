import { prisma } from "@/lib/prisma";
import { groundHandlingSchema } from "@/lib/validations/ground-handling";

const GROUND_HANDLING_ACTIVITY_TYPE_CODE = "GROUND_HANDLING";

// Même structure que createFlight/createTrainingCamp : couche métier
// indépendante de l'UI, Activity toujours créée avant sa spécialisation dans
// la même transaction (docs/decisions/001-activity-model.md).
export async function createGroundHandlingSession(userId: string, rawInput: unknown) {
  const input = groundHandlingSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const activityType = await tx.activityType.findUniqueOrThrow({
      where: { code: GROUND_HANDLING_ACTIVITY_TYPE_CODE },
    });

    const activity = await tx.activity.create({
      data: {
        userId,
        activityTypeId: activityType.id,
      },
    });

    return tx.groundHandlingSession.create({
      data: {
        activityId: activity.id,
        siteId: input.siteId,
        date: input.date,
        durationMin: input.durationMin,
        exercises: input.exercises,
        difficulties: input.difficulties,
        feeling: input.feeling,
      },
    });
  });
}
