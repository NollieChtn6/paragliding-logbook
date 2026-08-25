import { prisma } from "@/lib/prisma";
import { QualificationNotFoundError } from "./qualification-not-found.error";

// Pas de passage par deleteActivity (features/activities) : Qualification
// n'est pas une spécialisation d'Activity (décision explicite, voir
// schema.prisma), donc pas de ligne Activity à supprimer en cascade — un
// simple delete scopé par propriétaire suffit.
export async function deleteQualification(userId: string, qualificationId: string): Promise<void> {
  const existing = await prisma.qualification.findFirst({
    where: { id: qualificationId, userId },
  });
  if (!existing) {
    throw new QualificationNotFoundError();
  }

  await prisma.qualification.delete({ where: { id: qualificationId } });
}
