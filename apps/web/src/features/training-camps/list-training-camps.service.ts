import { prisma } from "@/lib/prisma";

// Alimente le sélecteur "Stage associé" de FlightForm : uniquement les
// stages de l'utilisateur courant (rattachement via Activity.userId, pas de
// champ userId direct sur TrainingCamp).
export function listTrainingCamps(userId: string) {
  return prisma.trainingCamp.findMany({
    where: { activity: { userId } },
    include: { school: true },
    orderBy: { startDate: "desc" },
  });
}
