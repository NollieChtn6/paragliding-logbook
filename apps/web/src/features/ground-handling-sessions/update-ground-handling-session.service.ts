import { ZodError, type ZodIssue } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { prisma } from "@/lib/prisma";
import { groundHandlingSchema } from "@/lib/validations/ground-handling";

// Même structure que createGroundHandlingSession
// (create-ground-handling-session.service.ts).
export async function updateGroundHandlingSession(
  userId: string,
  activityId: string,
  rawInput: unknown,
) {
  const input = groundHandlingSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findFirst({ where: { id: activityId, userId } });
    if (!activity) {
      throw new ActivityNotFoundError();
    }

    // Règle métier docs/domain-model.md (Stage), identique à la création
    // (create-ground-handling-session.service.ts) : une séance rattachée à
    // un stage doit avoir une date dans l'intervalle du stage. activity:
    // { userId } vérifie aussi que le stage appartient à l'utilisateur
    // courant.
    if (input.trainingCampId) {
      const trainingCamp = await tx.trainingCamp.findFirst({
        where: { id: input.trainingCampId, activity: { userId } },
      });
      if (!trainingCamp) {
        const issue: ZodIssue = {
          code: "custom",
          path: ["trainingCampId"],
          message: "Ce stage n'existe pas ou ne vous appartient pas.",
        };
        throw new ZodError([issue]);
      }
      // Comparaison au jour près, voir create-flight.service.ts.
      const sessionDay = input.date.toISOString().slice(0, 10);
      const startDay = trainingCamp.startDate.toISOString().slice(0, 10);
      const endDay = trainingCamp.endDate.toISOString().slice(0, 10);
      if (sessionDay < startDay || sessionDay > endDay) {
        const issue: ZodIssue = {
          code: "custom",
          path: ["date"],
          message: "La date de la séance doit être comprise dans l'intervalle du stage.",
        };
        throw new ZodError([issue]);
      }
    }

    return tx.groundHandlingSession.update({
      where: { activityId },
      data: {
        spotId: input.spotId,
        // ?? null (pas juste input.trainingCampId) : contrairement à create,
        // un update Prisma ignore les champs undefined au lieu de les
        // effacer — nécessaire pour permettre de retirer le stage associé.
        trainingCampId: input.trainingCampId ?? null,
        date: input.date,
        durationMin: input.durationMin,
        exercises: input.exercises,
        difficulties: input.difficulties ?? null,
        feeling: input.feeling ?? null,
      },
    });
  });
}
