import { prisma } from "@/lib/prisma";

export type ParcoursEntry =
  | { kind: "training-camp"; date: Date; trainingCampTypeCode: string; schoolName: string }
  | {
      kind: "qualification";
      date: Date;
      qualificationTypeCode: string;
      schoolName: string | null;
    };

// Compose deux domaines qui n'ont sinon aucun seam commun (stages,
// brevets) : n'a pas sa place dans features/training-camps ni
// features/qualifications, qui ne se connaissent pas l'un l'autre. Ne
// touche jamais features/flights (vols/paliers, voir
// get-flight-progression.service.ts) : Parcours est une histoire distincte
// de la progression en vol.
export async function getParcoursTimeline(userId: string): Promise<ParcoursEntry[]> {
  // Comparaison au jour près (même convention que
  // lib/validations/qualification.ts pour obtainedDate) : endDate est
  // stockée à minuit UTC du jour calendaire de fin (voir
  // lib/validations/training-camp.ts, z.coerce.date), donc un stage dont
  // endDate est AUJOURD'HUI n'est pas encore strictement avant ce seuil —
  // il ne compte pas encore comme terminé, conformément à la règle métier.
  const startOfToday = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);

  const [completedTrainingCamps, qualifications] = await Promise.all([
    prisma.trainingCamp.findMany({
      where: { activity: { userId }, endDate: { lt: startOfToday } },
      select: {
        endDate: true,
        trainingCampType: { select: { code: true } },
        school: { select: { name: true } },
      },
    }),
    prisma.qualification.findMany({
      where: { userId },
      select: {
        obtainedDate: true,
        qualificationType: { select: { code: true } },
        school: { select: { name: true } },
      },
    }),
  ]);

  const entries: ParcoursEntry[] = [
    ...completedTrainingCamps.map(
      (camp): ParcoursEntry => ({
        kind: "training-camp",
        date: camp.endDate,
        trainingCampTypeCode: camp.trainingCampType.code,
        schoolName: camp.school.name,
      }),
    ),
    ...qualifications.map(
      (qualification): ParcoursEntry => ({
        kind: "qualification",
        date: qualification.obtainedDate,
        qualificationTypeCode: qualification.qualificationType.code,
        schoolName: qualification.school?.name ?? null,
      }),
    ),
  ];

  // Le plus récent en premier : même ordre que la liste des paliers de vol
  // sur la même page (app/(app)/progression/page.tsx).
  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}
