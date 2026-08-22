import { prisma } from "@/lib/prisma";

export type FlightTotals = { count: number; totalMinutes: number };

// Requête dédiée, appelée juste avant la création d'un vol pour connaître
// l'état "avant" (voir flight-milestone.ts) : moins coûteuse que de dériver
// ces totaux de listActivities (inclusions profondes non nécessaires ici).
export async function getFlightTotals(userId: string): Promise<FlightTotals> {
  const [count, aggregate] = await Promise.all([
    prisma.flight.count({ where: { activity: { userId } } }),
    prisma.flight.aggregate({
      where: { activity: { userId } },
      _sum: { durationMin: true },
    }),
  ]);

  return { count, totalMinutes: aggregate._sum.durationMin ?? 0 };
}
