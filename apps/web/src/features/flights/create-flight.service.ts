import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { flightSchema } from "@/lib/validations/flight";

const FLIGHT_ACTIVITY_TYPE_CODE = "FLIGHT";

// Couche métier indépendante de l'UI : reçoit des données brutes, valide,
// puis persiste. Respecte le modèle Activity -> Flight
// (docs/decisions/001-activity-model.md) : une Activity est toujours créée
// avant sa spécialisation, dans la même transaction. Les erreurs de
// validation (ZodError) remontent telles quelles à l'appelant.
export async function createFlight(userId: string, rawInput: unknown) {
  const input = flightSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const activityType = await tx.activityType.findUniqueOrThrow({
      where: { code: FLIGHT_ACTIVITY_TYPE_CODE },
    });

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

    const activity = await tx.activity.create({
      data: {
        userId,
        activityTypeId: activityType.id,
      },
    });

    return tx.flight.create({
      data: {
        activityId: activity.id,
        siteId: input.siteId,
        trainingCampId: input.trainingCampId,
        date: input.date,
        takeoffAltitudeM: input.takeoffAltitudeM,
        landingAltitudeM: input.landingAltitudeM,
        durationMin: input.durationMin,
        flightType: input.flightType,
        observations: input.observations,
        improvementPoints: input.improvementPoints,
      },
    });
  });
}
