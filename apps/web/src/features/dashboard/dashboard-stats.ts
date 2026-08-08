import type { ActivityWithDetails } from "@/features/activities";

export type DashboardStats = {
  flightCount: number;
  totalFlightMinutes: number;
  averageFlightMinutes: number | null;
  groundHandlingSessionCount: number;
  totalGroundHandlingMinutes: number;
  totalActivityCount: number;
};

// Fonction pure, indépendante de Prisma et de React (même principe que
// activity-summary.ts) : calculée en mémoire sur le résultat déjà chargé par
// listActivities, pas de nouvelle requête Prisma.
export function getDashboardStats(activities: ActivityWithDetails[]): DashboardStats {
  const flights = activities.flatMap((activity) => (activity.flight ? [activity.flight] : []));
  const groundHandlingSessions = activities.flatMap((activity) =>
    activity.groundHandlingSession ? [activity.groundHandlingSession] : [],
  );

  const totalFlightMinutes = flights.reduce((sum, flight) => sum + flight.durationMin, 0);
  const totalGroundHandlingMinutes = groundHandlingSessions.reduce(
    (sum, session) => sum + session.durationMin,
    0,
  );

  return {
    flightCount: flights.length,
    totalFlightMinutes,
    averageFlightMinutes:
      flights.length > 0 ? Math.round(totalFlightMinutes / flights.length) : null,
    groundHandlingSessionCount: groundHandlingSessions.length,
    totalGroundHandlingMinutes,
    totalActivityCount: activities.length,
  };
}
