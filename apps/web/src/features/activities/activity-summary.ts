import { ACTIVITY_TYPE_LABELS } from "@/lib/reference-labels";
import type { ActivityWithDetails } from "./queries";

export type ActivitySummary = {
  title: string;
  subtitle: string;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

// takeoffPoint et landingPoint peuvent appartenir à des sites différents
// (ex. cross) : n'affiche qu'un seul nom quand c'est le même site, "A → B"
// sinon. Exportée : réutilisée telle quelle par /activities/[id] pour la
// liste condensée "Vols associés" d'un stage.
export function formatFlightLocation(flight: {
  takeoffPoint: { site: { name: string } };
  landingPoint: { site: { name: string } };
}): string {
  const takeoffSite = flight.takeoffPoint.site.name;
  const landingSite = flight.landingPoint.site.name;
  return takeoffSite === landingSite ? takeoffSite : `${takeoffSite} → ${landingSite}`;
}

// Résumé condensé affiché dans la liste /activities (le détail complet est
// réservé à /activities/[id]). Une fonction pure, indépendante de Prisma et
// de React, pour rester facilement testable.
export function getActivitySummary(activity: ActivityWithDetails): ActivitySummary {
  if (activity.flight) {
    const { flight } = activity;
    return {
      title: "Vol",
      subtitle: `${formatFlightLocation(flight)} · ${formatDate(flight.date)} · ${flight.durationMin} min`,
    };
  }

  if (activity.trainingCamp) {
    const { trainingCamp } = activity;
    return {
      title: "Stage",
      subtitle: `${trainingCamp.school.name} · ${formatDate(trainingCamp.startDate)} → ${formatDate(trainingCamp.endDate)}`,
    };
  }

  if (activity.groundHandlingSession) {
    const { groundHandlingSession } = activity;
    return {
      title: "Gonflage",
      subtitle: `${groundHandlingSession.site.name} · ${formatDate(groundHandlingSession.date)} · ${groundHandlingSession.durationMin} min`,
    };
  }

  return {
    title: ACTIVITY_TYPE_LABELS[activity.activityType.code] ?? activity.activityType.code,
    subtitle: "",
  };
}
