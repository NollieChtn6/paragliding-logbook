import { listActivities } from "@/features/activities";
import { type DashboardStats, getDashboardStats } from "./dashboard-stats";

const RECENT_ACTIVITIES_LIMIT = 5;

export type DashboardData = {
  stats: DashboardStats;
  recentActivities: Awaited<ReturnType<typeof listActivities>>;
};

// Réutilise listActivities (features/activities) comme unique source de
// données : déjà filtrée par userId, déjà triée par date d'événement
// décroissante. Les stats et les activités récentes sont dérivées du même
// résultat, sans requête Prisma supplémentaire.
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const activities = await listActivities(userId);

  return {
    stats: getDashboardStats(activities),
    recentActivities: activities.slice(0, RECENT_ACTIVITIES_LIMIT),
  };
}
