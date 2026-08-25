import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { groundHandlingSchema } from "@/lib/validations/ground-handling";
import type { Messages } from "@/messages";

const GROUND_HANDLING_ACTIVITY_TYPE_CODE = "GROUND_HANDLING";

// Même structure que createFlight/createTrainingCamp : couche métier
// indépendante de l'UI, Activity toujours créée avant sa spécialisation dans
// la même transaction (docs/decisions/001-activity-model.md).
export async function createGroundHandlingSession(
  userId: string,
  rawInput: unknown,
  t: Messages["validation"]["groundHandling"],
) {
  const input = groundHandlingSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    // wingId/harnessId : optionnels, doivent référencer un Equipment
    // appartenant à userId ET du bon EquipmentType — même principe que
    // create-flight.service.ts (voir son commentaire pour le détail).
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

    const activityType = await tx.activityType.findUniqueOrThrow({
      where: { code: GROUND_HANDLING_ACTIVITY_TYPE_CODE },
    });

    // Règle métier docs/domain-model.md (Stage) : une séance rattachée à un
    // stage doit avoir une date dans l'intervalle [startDate, endDate] du
    // stage. Même traitement que create-flight.service.ts : ZodError
    // construite manuellement pour réutiliser tel quel le mapping d'erreur
    // déjà en place dans actions/create-ground-handling-session.ts.
    // activity: { userId } vérifie aussi que le stage appartient à
    // l'utilisateur courant (voir create-flight.service.ts).
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
      // Comparaison au jour près (pas à l'instant près), voir
      // create-flight.service.ts.
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

    const activity = await tx.activity.create({
      data: {
        userId,
        activityTypeId: activityType.id,
      },
    });

    return tx.groundHandlingSession.create({
      data: {
        activityId: activity.id,
        spotId: input.spotId,
        trainingCampId: input.trainingCampId,
        date: input.date,
        durationMin: input.durationMin,
        exercises: input.exercises,
        difficulties: input.difficulties,
        feeling: input.feeling,
        wingId: input.wingId,
        harnessId: input.harnessId,
      },
    });
  });
}
