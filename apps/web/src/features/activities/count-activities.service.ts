import { prisma } from "@/lib/prisma";

// Requête dédiée, minimale : appelée juste avant la création d'une activité
// pour détecter le cap "première activité" (activity-milestone.ts), pas
// besoin du chargement complet fait par listActivities.
export async function countActivities(userId: string): Promise<number> {
  return prisma.activity.count({ where: { userId } });
}
