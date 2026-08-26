import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { flightSchema } from "@/lib/validations/flight";
import type { Messages } from "@/messages";

const FLIGHT_ACTIVITY_TYPE_CODE = "FLIGHT";

// Couche métier indépendante de l'UI : reçoit des données brutes, valide,
// puis persiste. Respecte le modèle Activity -> Flight
// (docs/decisions/001-activity-model.md) : une Activity est toujours créée
// avant sa spécialisation, dans la même transaction. Les erreurs de
// validation (ZodError) remontent telles quelles à l'appelant.
export async function createFlight(
  userId: string,
  rawInput: unknown,
  t: Messages["validation"]["flight"],
) {
  const input = flightSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    // wingId/harnessId/reserveId : optionnels, doivent référencer un
    // Equipment appartenant à userId ET du bon EquipmentType (docs/domain-model.md
    // > Règles métier > Matériel) — même principe que takeoffPoint/landingPoint
    // ci-dessous (existence + type vérifiés ensemble), avec en plus un
    // contrôle de propriété (Equipment est une donnée personnelle, à la
    // différence de Site).
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

    const activityType = await tx.activityType.findUniqueOrThrow({
      where: { code: FLIGHT_ACTIVITY_TYPE_CODE },
    });

    // Site est une donnée de référence partagée (comme Spot) : simple
    // vérification d'existence, pas de contrôle de propriété (à la différence
    // de trainingCampId ci-dessous, qui appartient à un utilisateur). Le type
    // du site est vérifié en plus de son existence
    // (docs/decisions/005-flight-takeoff-landing-points.md) : takeoffPointId
    // doit référencer un site TAKEOFF, landingPointId un site LANDING —
    // non exprimable par la seule FK SQL.
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

    // Règle métier docs/domain-model.md (Stage) : un vol rattaché à un stage
    // doit avoir une date dans l'intervalle [startDate, endDate] du stage.
    // Pas exprimable en Zod pur (nécessite de lire le TrainingCamp en base) :
    // ZodError construite manuellement pour réutiliser tel quel le mapping
    // d'erreur déjà en place dans actions/create-flight.ts. Le filtre
    // activity: { userId } vérifie aussi que le stage appartient bien à
    // l'utilisateur courant — sans ça, n'importe quel trainingCampId existant
    // serait accepté, quel que soit son propriétaire (listTrainingCamps ne
    // propose que les stages de l'utilisateur dans l'UI, mais l'action reste
    // un endpoint public : la vérification doit être refaite ici).
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
      // Comparaison au jour près (pas à l'instant près) : startDate/endDate
      // n'ont pas d'heure, alors qu'input.date en a désormais une (voir
      // lib/validations/flight.ts) — comparer les instants complets
      // rejetterait à tort un vol en fin de journée le dernier jour du
      // stage (son heure dépasserait le minuit d'endDate).
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

    const activity = await tx.activity.create({
      data: {
        userId,
        activityTypeId: activityType.id,
      },
    });

    return tx.flight.create({
      data: {
        activityId: activity.id,
        takeoffPointId: input.takeoffPointId,
        landingPointId: input.landingPointId,
        trainingCampId: input.trainingCampId,
        date: input.date,
        durationMin: input.durationMin,
        flightTypeId: input.flightTypeId,
        wingId: input.wingId,
        harnessId: input.harnessId,
        reserveId: input.reserveId,
        observations: input.observations,
        improvementPoints: input.improvementPoints,
      },
    });
  });
}
