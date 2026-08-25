import { prisma } from "@/lib/prisma";

// Qualification est rattachée directement à userId (pas via Activity, à la
// différence de Flight/TrainingCamp/GroundHandlingSession — voir
// schema.prisma) : scoping direct, pas de passage par Activity.
export async function listQualifications(userId: string) {
  return prisma.qualification.findMany({
    where: { userId },
    include: { qualificationType: true, school: true },
    orderBy: { obtainedDate: "desc" },
  });
}

export type QualificationListItem = Awaited<ReturnType<typeof listQualifications>>[number];
