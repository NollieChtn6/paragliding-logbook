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

    // SitePoint est une donnée de référence partagée (comme Site) : simple
    // vérification d'existence, pas de contrôle de propriété (à la différence
    // de trainingCampId ci-dessous, qui appartient à un utilisateur). Le type
    // du point est vérifié en plus de son existence
    // (docs/decisions/005-flight-takeoff-landing-points.md) : takeoffPointId
    // doit référencer un point TAKEOFF, landingPointId un point LANDING —
    // non exprimable par la seule FK SQL.
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
        takeoffPointId: input.takeoffPointId,
        landingPointId: input.landingPointId,
        trainingCampId: input.trainingCampId,
        date: input.date,
        durationMin: input.durationMin,
        flightTypeId: input.flightTypeId,
        observations: input.observations,
        improvementPoints: input.improvementPoints,
      },
    });
  });
}
