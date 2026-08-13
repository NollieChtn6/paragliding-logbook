import { formatDate } from "@/lib/format-date";
import type { Locale } from "@/lib/i18n/locale-cookie";
import type { Messages } from "@/messages";
import type { ActivityWithDetails } from "./queries";

// 3 lignes distinctes (ActivityCard, components/activity-card.tsx) plutôt
// qu'un sous-titre combiné : spécialité, lieu (école pour un stage, spot
// pour un vol/gonflage), puis dates — la durée n'y figure plus, réservée au
// détail de l'activité (/activities/[id]).
export type ActivitySummary = {
  title: string;
  location: string;
  dateInfo: string;
};

// Extraction directe des composantes UTC (pas toLocaleTimeString, dépendant
// du fuseau du serveur) : l'heure est stockée en UTC littéral, sans
// conversion de fuseau (voir lib/validations/flight.ts), donc relue de la
// même façon.
function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

// takeoffPoint et landingPoint peuvent appartenir à des spots différents
// (ex. cross) : n'affiche qu'un seul nom quand c'est le même spot, "A → B"
// sinon. Exportée : réutilisée telle quelle par /activities/[id] pour la
// liste condensée "Vols associés" d'un stage.
export function formatFlightLocation(flight: {
  takeoffPoint: { spot: { name: string } };
  landingPoint: { spot: { name: string } };
}): string {
  const takeoffSpot = flight.takeoffPoint.spot.name;
  const landingSpot = flight.landingPoint.spot.name;
  return takeoffSpot === landingSpot ? takeoffSpot : `${takeoffSpot} → ${landingSpot}`;
}

// Résumé condensé affiché dans la liste /activities (le détail complet est
// réservé à /activities/[id]). Une fonction pure, indépendante de Prisma et
// de React (mais pas de la locale, transmise en paramètre comme partout
// ailleurs — voir docs/decisions/009), pour rester facilement testable.
export function getActivitySummary(
  activity: ActivityWithDetails,
  locale: Locale,
  t: Messages,
): ActivitySummary {
  if (activity.flight) {
    const { flight } = activity;
    return {
      title: t.referenceLabels.activityType.FLIGHT,
      location: formatFlightLocation(flight),
      dateInfo: `${formatDate(flight.date, locale)} ${t.common.at} ${formatTime(flight.date)}`,
    };
  }

  if (activity.trainingCamp) {
    const { trainingCamp } = activity;
    return {
      title: t.referenceLabels.activityType.TRAINING_CAMP,
      location: trainingCamp.school.name,
      dateInfo: `${formatDate(trainingCamp.startDate, locale)} → ${formatDate(trainingCamp.endDate, locale)}`,
    };
  }

  if (activity.groundHandlingSession) {
    const { groundHandlingSession } = activity;
    return {
      title: t.referenceLabels.activityType.GROUND_HANDLING,
      location: groundHandlingSession.spot.name,
      dateInfo: `${formatDate(groundHandlingSession.date, locale)} ${t.common.at} ${formatTime(groundHandlingSession.date)}`,
    };
  }

  return {
    title: t.referenceLabels.activityType[activity.activityType.code] ?? activity.activityType.code,
    location: "",
    dateInfo: "",
  };
}
