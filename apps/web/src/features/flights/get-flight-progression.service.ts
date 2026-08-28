import { prisma } from "@/lib/prisma";
import {
  getFlightMilestoneHistory,
  getFlightProgressionTrend,
  type MilestoneHistoryEntry,
  type ProgressionPoint,
} from "./flight-milestone-history";
import {
  type AverageDurationPoint,
  type FavoriteSite,
  type FlightTypeBreakdownEntry,
  getAverageDurationTrend,
  getDistinctSitesCount,
  getFavoriteSite,
  getFlightTypeBreakdown,
  getLatestMonthDelta,
  getLongestFlightDuration,
} from "./flight-progression-charts";

export type FlightProgression = {
  flightCount: number;
  trend: ProgressionPoint[];
  flightCountDelta: number | undefined;
  flightHoursDelta: number | undefined;
  milestoneHistory: MilestoneHistoryEntry[];
  flightTypeBreakdown: FlightTypeBreakdownEntry[];
  sitesCount: number;
  favoriteSite: FavoriteSite | undefined;
  longestFlightDuration: number | undefined;
  averageDurationTrend: AverageDurationPoint[];
  averageDurationDelta: number | undefined;
};

// select élargi (initialement date + durée seulement) : flightType et les
// sites de décollage/atterrissage (avec leur label, pas juste l'id — voir
// getFavoriteSite) nourrissent désormais la répartition par type, le total
// de sites distincts et le site favori — toujours une seule requête vols,
// pas de requête supplémentaire pour ces ajouts. flightType.findMany à
// part : seule façon de connaître les types JAMAIS volés (voir
// getFlightTypeBreakdown, flight-progression-charts.ts), un type sans vol
// n'apparaîtrait dans aucune ligne de la requête ci-dessus.
export async function getFlightProgression(userId: string): Promise<FlightProgression> {
  const [flights, flightTypes] = await Promise.all([
    prisma.flight.findMany({
      where: { activity: { userId } },
      select: {
        date: true,
        durationMin: true,
        takeoffPoint: { select: { id: true, label: true } },
        landingPoint: { select: { id: true, label: true } },
        flightType: { select: { code: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.flightType.findMany({ select: { code: true } }),
  ]);

  const trend = getFlightProgressionTrend(flights);
  const averageDurationTrend = getAverageDurationTrend(flights);

  return {
    flightCount: flights.length,
    trend,
    flightCountDelta: getLatestMonthDelta(trend.map((point) => point.cumulativeCount)),
    flightHoursDelta: getLatestMonthDelta(trend.map((point) => point.cumulativeHours)),
    milestoneHistory: getFlightMilestoneHistory(flights),
    flightTypeBreakdown: getFlightTypeBreakdown(
      flights.map((flight) => ({ flightTypeCode: flight.flightType.code })),
      flightTypes.map((flightType) => flightType.code),
    ),
    sitesCount: getDistinctSitesCount(
      flights.map((flight) => ({
        takeoffSiteId: flight.takeoffPoint.id,
        landingSiteId: flight.landingPoint.id,
      })),
    ),
    favoriteSite: getFavoriteSite(
      flights.map((flight) => ({
        takeoffSite: flight.takeoffPoint,
        landingSite: flight.landingPoint,
      })),
    ),
    longestFlightDuration: getLongestFlightDuration(flights),
    averageDurationTrend,
    averageDurationDelta: getLatestMonthDelta(
      averageDurationTrend.map((point) => point.averageMinutes),
    ),
  };
}
