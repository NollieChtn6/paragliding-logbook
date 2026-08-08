import type { Prisma } from "@prisma/client";

// Inclusion partagée entre listActivities et getActivityById : Activity n'a
// pas de champ propre au-delà de son type, il faut toujours charger la
// spécialisation correspondante pour l'afficher.
export const ACTIVITY_WITH_DETAILS_INCLUDE = {
  activityType: true,
  flight: { include: { site: true, trainingCamp: true } },
  trainingCamp: {
    include: { school: true, flights: { include: { site: true }, orderBy: { date: "asc" } } },
  },
  groundHandlingSession: { include: { site: true } },
} satisfies Prisma.ActivityInclude;

export type ActivityWithDetails = Prisma.ActivityGetPayload<{
  include: typeof ACTIVITY_WITH_DETAILS_INCLUDE;
}>;

// Activity n'a pas de champ "date" propre (schema.prisma) : seule chaque
// spécialisation en a un. C'est la date de l'événement (quand le vol/stage/
// gonflage a eu lieu), pas createdAt (quand la ligne a été insérée), qui
// détermine la position dans un carnet de bord chronologique.
export function getActivityEventDate(activity: ActivityWithDetails): Date {
  return (
    activity.flight?.date ??
    activity.trainingCamp?.startDate ??
    activity.groundHandlingSession?.date ??
    activity.createdAt
  );
}
