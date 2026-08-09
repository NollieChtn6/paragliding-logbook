import { prisma } from "@/lib/prisma";
import { ActivityNotFoundError } from "./activity-not-found.error";

// Suppression générique, quel que soit le type d'activité : Flight,
// TrainingCamp et GroundHandlingSession référencent tous leur Activity via
// onDelete: Cascade (schema.prisma), donc supprimer l'Activity suffit à
// supprimer sa spécialisation. Un vol/une séance de gonflage rattaché à un
// stage supprimé n'est pas supprimé pour autant : trainingCampId est en
// onDelete: SetNull, il est seulement dissocié.
export async function deleteActivity(userId: string, activityId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.findFirst({ where: { id: activityId, userId } });
    if (!activity) {
      throw new ActivityNotFoundError();
    }

    await tx.activity.delete({ where: { id: activityId } });
  });
}
