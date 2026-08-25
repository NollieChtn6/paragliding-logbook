import { prisma } from "@/lib/prisma";

// Scopé par userId : à la différence de getSchool (référentiel partagé), un
// élément de matériel est une donnée personnelle — ne jamais renvoyer celui
// d'un autre utilisateur (même posture que getQualification).
export async function getEquipment(userId: string, equipmentId: string) {
  return prisma.equipment.findFirst({
    where: { id: equipmentId, userId },
    include: { equipmentType: true },
  });
}

export type Equipment = NonNullable<Awaited<ReturnType<typeof getEquipment>>>;
