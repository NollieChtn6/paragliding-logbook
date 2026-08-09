import { ZodError, type ZodIssue } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { prisma } from "@/lib/prisma";
import { flightSchema } from "@/lib/validations/flight";

// Même structure que createFlight (create-flight.service.ts) : valide, puis
// persiste dans une transaction. La vérification de propriété (activité
// appartient à userId) se fait dans la même transaction que l'update, pour
// éviter une fenêtre entre le contrôle et l'écriture.
export async function updateFlight(userId: string, activityId: string, rawInput: unknown) {
  const input = flightSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findFirst({ where: { id: activityId, userId } });
    if (!activity) {
      throw new ActivityNotFoundError();
    }

    // SitePoint est une donnée de référence partagée (comme Site) : simple
    // vérification d'existence, pas de contrôle de propriété. Le type du
    // point est vérifié en plus de son existence
    // (docs/decisions/005-flight-takeoff-landing-points.md) : takeoffPointId
    // doit référencer un point TAKEOFF, landingPointId un point LANDING.
    const [takeoffPoint, landingPoint] = await Promise.all([
      tx.sitePoint.findUnique({
        where: { id: input.takeoffPointId },
        include: { sitePointType: true },
      }),
      tx.sitePoint.findUnique({
        where: { id: input.landingPointId },
        include: { sitePointType: true },
      }),
    ]);
    if (!takeoffPoint) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["takeoffPointId"],
        message: "Ce point de décollage n'existe pas.",
      };
      throw new ZodError([issue]);
    }
    if (takeoffPoint.sitePointType.code !== "TAKEOFF") {
      const issue: ZodIssue = {
        code: "custom",
        path: ["takeoffPointId"],
        message: "Ce point n'est pas un point de décollage.",
      };
      throw new ZodError([issue]);
    }
    if (!landingPoint) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["landingPointId"],
        message: "Ce point d'atterrissage n'existe pas.",
      };
      throw new ZodError([issue]);
    }
    if (landingPoint.sitePointType.code !== "LANDING") {
      const issue: ZodIssue = {
        code: "custom",
        path: ["landingPointId"],
        message: "Ce point n'est pas un point d'atterrissage.",
      };
      throw new ZodError([issue]);
    }

    // FlightType est une donnée de référence partagée, même traitement que
    // SitePoint ci-dessus (docs/decisions/003-reference-table-codes.md).
    const flightType = await tx.flightType.findUnique({ where: { id: input.flightTypeId } });
    if (!flightType) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["flightTypeId"],
        message: "Ce type de vol n'existe pas.",
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
          message: "Ce stage n'existe pas ou ne vous appartient pas.",
        };
        throw new ZodError([issue]);
      }
      if (input.date < trainingCamp.startDate || input.date > trainingCamp.endDate) {
        const issue: ZodIssue = {
          code: "custom",
          path: ["date"],
          message: "La date du vol doit être comprise dans l'intervalle du stage.",
        };
        throw new ZodError([issue]);
      }
    }

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
        observations: input.observations,
        improvementPoints: input.improvementPoints,
      },
    });
  });
}
