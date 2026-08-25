import { prisma } from "@/lib/prisma";
import {
  getFlightMilestoneHistory,
  getFlightProgressionTrend,
  type MilestoneHistoryEntry,
  type ProgressionPoint,
} from "./flight-milestone-history";

export type FlightProgression = {
  flightCount: number;
  trend: ProgressionPoint[];
  milestoneHistory: MilestoneHistoryEntry[];
};

// select minimal (pas ACTIVITY_WITH_DETAILS_INCLUDE, features/activities/
// queries.ts) : la vue Progression ne montre que date + durée, inutile de
// charger sites/type/stage associé pour ça.
export async function getFlightProgression(userId: string): Promise<FlightProgression> {
  const flights = await prisma.flight.findMany({
    where: { activity: { userId } },
    select: { date: true, durationMin: true },
    orderBy: { date: "asc" },
  });

  return {
    flightCount: flights.length,
    trend: getFlightProgressionTrend(flights),
    milestoneHistory: getFlightMilestoneHistory(flights),
  };
}
