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
