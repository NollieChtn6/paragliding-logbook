import { prisma } from "@/lib/prisma";
import type { FlightInput } from "@/lib/validations/flight";

const FLIGHT_ACTIVITY_TYPE_CODE = "FLIGHT";

// Respecte le modèle Activity -> Flight (docs/decisions/001-activity-model.md) :
// une Activity est toujours créée avant sa spécialisation, dans la même transaction.
export async function createFlight(userId: string, input: FlightInput) {
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
