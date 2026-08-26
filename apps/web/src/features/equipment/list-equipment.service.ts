import { prisma } from "@/lib/prisma";

// Equipment est rattaché directement à userId (pas via Activity, à la
// différence de Flight/TrainingCamp/GroundHandlingSession — voir
// schema.prisma) : scoping direct, même principe que listQualifications.
export async function listEquipment(userId: string) {
  return prisma.equipment.findMany({
    where: { userId },
    include: { equipmentType: true },
    orderBy: { createdAt: "desc" },
  });
}

export type EquipmentListItem = Awaited<ReturnType<typeof listEquipment>>[number];
