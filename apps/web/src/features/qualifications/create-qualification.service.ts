import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { qualificationSchema } from "@/lib/validations/qualification";
import type { Messages } from "@/messages";

// Qualification n'est pas une spécialisation d'Activity (décision explicite,
// voir schema.prisma) : pas de transaction Activity + spécialisation comme
// createTrainingCamp/createFlight, juste les vérifications de FK avant la
// création. userId toujours résolu côté serveur, jamais fourni par le client.
export async function createQualification(
  userId: string,
  rawInput: unknown,
  t: Messages["validation"]["qualification"],
) {
  const input = qualificationSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    // QualificationType est une donnée de référence partagée, même
    // traitement que trainingCampTypeId dans create-training-camp.service.ts.
    const qualificationType = await tx.qualificationType.findUnique({
      where: { id: input.qualificationTypeId },
    });
    if (!qualificationType) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["qualificationTypeId"],
        message: t.typeNotFound,
      };
      throw new ZodError([issue]);
    }

    // School est une donnée de référence partagée (comme dans
    // create-training-camp.service.ts) : simple vérification d'existence.
    if (input.schoolId) {
      const school = await tx.school.findUnique({ where: { id: input.schoolId } });
      if (!school) {
        const issue: ZodIssue = {
          code: "custom",
          path: ["schoolId"],
          message: t.schoolNotFound,
        };
        throw new ZodError([issue]);
      }
    }

    // TrainingCamp appartient à un utilisateur via son Activity : le filtre
    // activity: { userId } vérifie aussi que le stage appartient bien à
    // l'utilisateur courant, même raisonnement que create-flight.service.ts
    // pour trainingCampId.
    if (input.trainingCampId) {
      const trainingCamp = await tx.trainingCamp.findFirst({
        where: { id: input.trainingCampId, activity: { userId } },
      });
      if (!trainingCamp) {
        const issue: ZodIssue = {
          code: "custom",
          path: ["trainingCampId"],
          message: t.trainingCampNotFound,
        };
        throw new ZodError([issue]);
      }
    }

    return tx.qualification.create({
      data: {
        userId,
        qualificationTypeId: input.qualificationTypeId,
        obtainedDate: input.obtainedDate,
        schoolId: input.schoolId,
        trainingCampId: input.trainingCampId,
        notes: input.notes,
      },
      // qualificationType inclus : le toast de succès nomme le brevet
      // obtenu plutôt qu'une confirmation générique (actions/create-qualification.ts).
      include: { qualificationType: true },
    });
  });
}
