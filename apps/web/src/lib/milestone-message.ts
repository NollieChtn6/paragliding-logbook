import type { ActivityMilestone } from "@/features/activities";
import type { FlightMilestone } from "@/features/flights";
import type { Messages } from "@/messages";

// Fonction pure, indépendante de React/Next.js — même principe que
// lib/greeting.ts : compose la phrase finale à partir de fragments statiques
// du dictionnaire plutôt que de stocker une phrase par valeur de compteur
// possible.
export function getMilestoneToastMessage(
  milestone: ActivityMilestone | FlightMilestone,
  t: Messages["toast"],
): string {
  switch (milestone.kind) {
    case "first-activity":
      return t.firstActivityCreated;
    case "flight-count":
      return `${milestone.count} ${t.flightCountMilestoneSuffix}`;
    case "flight-hours":
      return `${milestone.hours} ${t.flightHoursMilestoneSuffix}`;
  }
}
