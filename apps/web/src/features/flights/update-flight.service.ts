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
    // vérification d'existence, pas de contrôle de propriété.
    const [departurePoint, arrivalPoint] = await Promise.all([
      tx.sitePoint.findUnique({ where: { id: input.departurePointId } }),
      tx.sitePoint.findUnique({ where: { id: input.arrivalPointId } }),
    ]);
    if (!departurePoint) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["departurePointId"],
        message: "Ce point de départ n'existe pas.",
      };
      throw new ZodError([issue]);
    }
    if (!arrivalPoint) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["arrivalPointId"],
        message: "Ce point d'arrivée n'existe pas.",
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
        departurePointId: input.departurePointId,
        arrivalPointId: input.arrivalPointId,
        // ?? null (pas juste input.trainingCampId) : contrairement à create,
        // un update Prisma ignore les champs undefined au lieu de les
        // effacer — nécessaire pour permettre de retirer le stage associé.
        trainingCampId: input.trainingCampId ?? null,
        date: input.date,
        durationMin: input.durationMin,
        flightType: input.flightType,
        observations: input.observations,
        improvementPoints: input.improvementPoints,
      },
    });
  });
}
