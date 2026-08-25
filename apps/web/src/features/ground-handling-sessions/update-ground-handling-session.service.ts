import { ZodError, type ZodIssue } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { prisma } from "@/lib/prisma";
import { groundHandlingSchema } from "@/lib/validations/ground-handling";
import type { Messages } from "@/messages";

// Même structure que createGroundHandlingSession
// (create-ground-handling-session.service.ts).
export async function updateGroundHandlingSession(
  userId: string,
  activityId: string,
  rawInput: unknown,
  t: Messages["validation"]["groundHandling"],
) {
  const input = groundHandlingSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    // Voir create-ground-handling-session.service.ts pour le détail du
    // raisonnement.
    async function verifyEquipment(
      equipmentId: string | undefined,
      expectedTypeCode: "WING" | "HARNESS",
      fieldPath: "wingId" | "harnessId",
      notFoundMessage: string,
      wrongTypeMessage: string,
    ) {
      if (!equipmentId) {
        return;
      }
      const equipment = await tx.equipment.findFirst({
        where: { id: equipmentId, userId },
        include: { equipmentType: true },
      });
      if (!equipment) {
        const issue: ZodIssue = { code: "custom", path: [fieldPath], message: notFoundMessage };
        throw new ZodError([issue]);
      }
      if (equipment.equipmentType.code !== expectedTypeCode) {
        const issue: ZodIssue = { code: "custom", path: [fieldPath], message: wrongTypeMessage };
        throw new ZodError([issue]);
      }
    }

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
          message: t.trainingCampNotFound,
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
          message: t.dateOutsideTrainingCamp,
        };
        throw new ZodError([issue]);
      }
    }

    await Promise.all([
      verifyEquipment(input.wingId, "WING", "wingId", t.wingNotFound, t.wingWrongType),
      verifyEquipment(
        input.harnessId,
        "HARNESS",
        "harnessId",
        t.harnessNotFound,
        t.harnessWrongType,
      ),
    ]);

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
        wingId: input.wingId ?? null,
        harnessId: input.harnessId ?? null,
      },
    });
  });
}
