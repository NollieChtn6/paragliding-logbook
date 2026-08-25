// Chiffres ronds plutôt qu'une formule (ex. puissances de 2) : ce sont les
// paliers qu'un pilote reconnaît spontanément dans son propre carnet, pas un
// calcul arbitraire. Exportés (pas de const privée) : réutilisés tels quels
// par flight-milestone-history.ts, seule source de vérité sur "quels
// paliers existent" pour le toast (le plus haut franchi) comme pour
// l'historique (tous les paliers franchis).
export const FLIGHT_COUNT_MILESTONES = [10, 25, 50, 100, 250, 500, 1000] as const;
export const FLIGHT_HOURS_MILESTONES = [10, 25, 50, 100, 250, 500, 1000] as const;

export type FlightMilestone =
  | { kind: "flight-count"; count: number }
  | { kind: "flight-hours"; hours: number };

// Le plus haut palier franchi, pas le premier de la liste : un vol
// exceptionnellement long peut faire sauter plusieurs paliers d'un coup
// (ex. 5h -> 25h) — annoncer le plus bas (10h) donnerait un chiffre déjà
// dépassé, donc trompeur sur l'état réel du carnet.
function highestCrossedMilestone(
  milestones: readonly number[],
  previousValue: number,
  newValue: number,
): number | undefined {
  return milestones
    .filter((milestone) => previousValue < milestone && newValue >= milestone)
    .at(-1);
}

// Fonction pure, même principe que dashboard-stats.ts. previousCount/
// previousTotalMinutes désignent l'état AVANT le vol qu'on vient
// d'enregistrer. Le compte de vols est vérifié avant le cap horaire : un
// chiffre rond de vols se lit plus immédiatement qu'un cap horaire, pour le
// cas rare où un seul vol ferait franchir les deux à la fois.
export function getFlightMilestone(
  previousCount: number,
  previousTotalMinutes: number,
  newDurationMin: number,
): FlightMilestone | null {
  const newCount = previousCount + 1;
  const countMilestone = highestCrossedMilestone(FLIGHT_COUNT_MILESTONES, previousCount, newCount);
  if (countMilestone !== undefined) {
    return { kind: "flight-count", count: countMilestone };
  }

  const previousHours = previousTotalMinutes / 60;
  const newHours = (previousTotalMinutes + newDurationMin) / 60;
  const hoursMilestone = highestCrossedMilestone(FLIGHT_HOURS_MILESTONES, previousHours, newHours);
  if (hoursMilestone !== undefined) {
    return { kind: "flight-hours", hours: hoursMilestone };
  }

  return null;
}
