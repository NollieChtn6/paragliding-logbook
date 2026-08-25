import { prisma } from "@/lib/prisma";

// Scopé par userId : à la différence de getSchool (référentiel partagé), un
// brevet est une donnée personnelle — ne jamais renvoyer celui d'un autre
// utilisateur (même posture que getActivityById).
export async function getQualification(userId: string, qualificationId: string) {
  return prisma.qualification.findFirst({
    where: { id: qualificationId, userId },
  });
}

export type Qualification = NonNullable<Awaited<ReturnType<typeof getQualification>>>;
