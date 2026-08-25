import {
  FLIGHT_COUNT_MILESTONES,
  FLIGHT_HOURS_MILESTONES,
  type FlightMilestone,
} from "./flight-milestone";

export type FlightForProgression = { date: Date; durationMin: number };

export type MilestoneHistoryEntry = { milestone: FlightMilestone; date: Date };

// Contrairement à getFlightMilestone (flight-milestone.ts), qui ne retient
// que le plus haut palier franchi par un vol donné (pour ne montrer qu'un
// seul toast, jamais trompeur sur l'état réel du carnet), l'historique
// retient TOUS les paliers franchis, y compris ceux "sautés" par un vol
// exceptionnellement long : chacun a réellement été atteint à un moment
// donné, et une vue Progression qui les omettrait raconterait une histoire
// incomplète du carnet.
export function getFlightMilestoneHistory(
  flights: FlightForProgression[],
): MilestoneHistoryEntry[] {
  const chronological = [...flights].sort((a, b) => a.date.getTime() - b.date.getTime());
  const history: MilestoneHistoryEntry[] = [];
  let count = 0;
  let totalMinutes = 0;

  for (const flight of chronological) {
    const previousCount = count;
    const previousHours = totalMinutes / 60;
    count += 1;
    totalMinutes += flight.durationMin;
    const newHours = totalMinutes / 60;

    for (const threshold of FLIGHT_COUNT_MILESTONES) {
      if (previousCount < threshold && count >= threshold) {
        history.push({ milestone: { kind: "flight-count", count: threshold }, date: flight.date });
      }
    }
    for (const threshold of FLIGHT_HOURS_MILESTONES) {
      if (previousHours < threshold && newHours >= threshold) {
        history.push({ milestone: { kind: "flight-hours", hours: threshold }, date: flight.date });
      }
    }
  }

  return history;
}

export type ProgressionPoint = { month: string; cumulativeCount: number; cumulativeHours: number };

// "month" au format "YYYY-MM" (tri lexicographique = tri chronologique,
// pas besoin de reparser une Date pour trier/afficher). Un point par mois
// calendaire ayant au moins un vol, valeur cumulée jusqu'à la fin de ce
// mois — pas un point par vol individuel, illisible dès quelques dizaines
// de vols dans un même mois actif.
export function getFlightProgressionTrend(flights: FlightForProgression[]): ProgressionPoint[] {
  const chronological = [...flights].sort((a, b) => a.date.getTime() - b.date.getTime());
  const points: ProgressionPoint[] = [];
  let cumulativeCount = 0;
  let cumulativeMinutes = 0;

  for (const flight of chronological) {
    const month = flight.date.toISOString().slice(0, 7);
    cumulativeCount += 1;
    cumulativeMinutes += flight.durationMin;

    const lastPoint = points.at(-1);
    if (lastPoint && lastPoint.month === month) {
      lastPoint.cumulativeCount = cumulativeCount;
      lastPoint.cumulativeHours = cumulativeMinutes / 60;
    } else {
      points.push({ month, cumulativeCount, cumulativeHours: cumulativeMinutes / 60 });
    }
  }

  return points;
}
