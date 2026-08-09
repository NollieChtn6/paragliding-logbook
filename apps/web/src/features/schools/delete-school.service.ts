import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";

// Relation directe de School (schema.prisma) : trainingCamps. Bloquer la
// suppression si non vide (docs/admin.md > Suppression, "supprimer un School
// ne doit pas supprimer des TrainingCamp existants").
export async function deleteSchool(schoolId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const trainingCampCount = await tx.trainingCamp.count({ where: { schoolId } });

    if (trainingCampCount > 0) {
      throw new ReferenceDataInUseError(
        "Cette école a encore des stages associés : ils doivent être supprimés ou réaffectés d'abord.",
      );
    }

    await tx.school.delete({ where: { id: schoolId } });
  });
}
