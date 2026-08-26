import { ZodError, type ZodIssue } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { prisma } from "@/lib/prisma";
import { flightSchema } from "@/lib/validations/flight";
import type { Messages } from "@/messages";

// Même structure que createFlight (create-flight.service.ts) : valide, puis
// persiste dans une transaction. La vérification de propriété (activité
// appartient à userId) se fait dans la même transaction que l'update, pour
// éviter une fenêtre entre le contrôle et l'écriture.
export async function updateFlight(
  userId: string,
  activityId: string,
  rawInput: unknown,
  t: Messages["validation"]["flight"],
) {
  const input = flightSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    // Voir create-flight.service.ts pour le détail du raisonnement.
    async function verifyEquipment(
      equipmentId: string | undefined,
      expectedTypeCode: "WING" | "HARNESS" | "RESERVE",
      fieldPath: "wingId" | "harnessId" | "reserveId",
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

    // Site est une donnée de référence partagée (comme Spot) : simple
    // vérification d'existence, pas de contrôle de propriété. Le type du
    // site est vérifié en plus de son existence
    // (docs/decisions/005-flight-takeoff-landing-points.md) : takeoffPointId
    // doit référencer un site TAKEOFF, landingPointId un site LANDING.
    const [takeoffPoint, landingPoint] = await Promise.all([
      tx.site.findUnique({
        where: { id: input.takeoffPointId },
        include: { siteType: true },
      }),
      tx.site.findUnique({
        where: { id: input.landingPointId },
        include: { siteType: true },
      }),
    ]);
    if (!takeoffPoint) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["takeoffPointId"],
        message: t.takeoffNotFound,
      };
      throw new ZodError([issue]);
    }
    if (takeoffPoint.siteType.code !== "TAKEOFF") {
      const issue: ZodIssue = {
        code: "custom",
        path: ["takeoffPointId"],
        message: t.takeoffWrongType,
      };
      throw new ZodError([issue]);
    }
    if (!landingPoint) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["landingPointId"],
        message: t.landingNotFound,
      };
      throw new ZodError([issue]);
    }
    if (landingPoint.siteType.code !== "LANDING") {
      const issue: ZodIssue = {
        code: "custom",
        path: ["landingPointId"],
        message: t.landingWrongType,
      };
      throw new ZodError([issue]);
    }

    // FlightType est une donnée de référence partagée, même traitement que
    // Site ci-dessus (docs/decisions/003-reference-table-codes.md).
    const flightType = await tx.flightType.findUnique({ where: { id: input.flightTypeId } });
    if (!flightType) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["flightTypeId"],
        message: t.flightTypeNotFound,
      };
      throw new ZodError([issue]);
    }

    // Règle métier docs/domain-model.md (Stage), identique à la création
    // (create-flight.service.ts) : un vol rattaché à un stage doit avoir une
    // date dans l'intervalle [startDate, endDate] du stage. activity: { userId }
    // vérifie aussi que le stage appartient à l'utilisateur courant.
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
      const flightDay = input.date.toISOString().slice(0, 10);
      const startDay = trainingCamp.startDate.toISOString().slice(0, 10);
      const endDay = trainingCamp.endDate.toISOString().slice(0, 10);
      if (flightDay < startDay || flightDay > endDay) {
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
      verifyEquipment(
        input.reserveId,
        "RESERVE",
        "reserveId",
        t.reserveNotFound,
        t.reserveWrongType,
      ),
    ]);

    return tx.flight.update({
      where: { activityId },
      data: {
        takeoffPointId: input.takeoffPointId,
        landingPointId: input.landingPointId,
        // ?? null (pas juste input.trainingCampId) : contrairement à create,
        // un update Prisma ignore les champs undefined au lieu de les
        // effacer — nécessaire pour permettre de retirer le stage associé.
        trainingCampId: input.trainingCampId ?? null,
        date: input.date,
        durationMin: input.durationMin,
        flightTypeId: input.flightTypeId,
        wingId: input.wingId ?? null,
        harnessId: input.harnessId ?? null,
        reserveId: input.reserveId ?? null,
        observations: input.observations,
        improvementPoints: input.improvementPoints,
      },
    });
  });
}
