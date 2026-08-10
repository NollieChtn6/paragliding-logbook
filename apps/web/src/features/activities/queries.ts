import type { Prisma } from "@prisma/client";

// Réutilisé pour takeoffPoint/landingPoint, à deux niveaux (Flight direct
// et TrainingCamp.flights) : évite de dupliquer le même include.
const SITE_POINT_INCLUDE = { include: { site: true, sitePointType: true } } satisfies {
  include: Prisma.SitePointInclude;
};

// Inclusion partagée entre listActivities et getActivityById : Activity n'a
// pas de champ propre au-delà de son type, il faut toujours charger la
// spécialisation correspondante pour l'afficher.
export const ACTIVITY_WITH_DETAILS_INCLUDE = {
  activityType: true,
  flight: {
    include: {
      takeoffPoint: SITE_POINT_INCLUDE,
      landingPoint: SITE_POINT_INCLUDE,
      flightType: true,
      // school en plus de trainingCampType : un utilisateur peut avoir
      // plusieurs stages du même type (ex. plusieurs "Perfectionnement") —
      // le badge "Stage associé" doit permettre de distinguer duquel il
      // s'agit (voir TrainingCampBadge, activities/[id]/page.tsx).
      trainingCamp: { include: { trainingCampType: true, school: true } },
    },
  },
  trainingCamp: {
    include: {
      school: true,
      trainingCampType: true,
      flights: {
        include: { takeoffPoint: SITE_POINT_INCLUDE, landingPoint: SITE_POINT_INCLUDE },
        orderBy: { date: "asc" },
      },
      groundHandlingSessions: { include: { site: true }, orderBy: { date: "asc" } },
    },
  },
  groundHandlingSession: {
    include: { site: true, trainingCamp: { include: { trainingCampType: true, school: true } } },
  },
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
