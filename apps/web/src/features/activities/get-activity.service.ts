import { prisma } from "@/lib/prisma";
import { ACTIVITY_WITH_DETAILS_INCLUDE, type ActivityWithDetails } from "./queries";

// findFirst (pas findUnique) : l'isolation par utilisateur exige de filtrer
// sur id ET userId ensemble, hors d'une contrainte unique composée.
export function getActivityById(id: string, userId: string): Promise<ActivityWithDetails | null> {
  return prisma.activity.findFirst({
    where: { id, userId },
    include: ACTIVITY_WITH_DETAILS_INCLUDE,
  });
}
