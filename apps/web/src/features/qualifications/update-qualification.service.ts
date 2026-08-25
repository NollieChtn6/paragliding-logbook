import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { qualificationSchema } from "@/lib/validations/qualification";
import type { Messages } from "@/messages";
import { QualificationNotFoundError } from "./qualification-not-found.error";

// Même structure que createQualification, avec vérification de propriété
// systématique (comme updateTrainingCamp/updateFlight) : un brevet
// n'appartenant pas à userId doit être traité comme inexistant.
export async function updateQualification(
  userId: string,
  qualificationId: string,
  rawInput: unknown,
  t: Messages["validation"]["qualification"],
) {
  const input = qualificationSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.qualification.findFirst({
      where: { id: qualificationId, userId },
    });
    if (!existing) {
      throw new QualificationNotFoundError();
    }

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

    return tx.qualification.update({
      where: { id: qualificationId },
      data: {
        qualificationTypeId: input.qualificationTypeId,
        obtainedDate: input.obtainedDate,
        // ?? null : un update Prisma ignore les champs undefined au lieu de
        // les effacer, contrairement à create (même principe que
        // update-school.service.ts/update-training-camp.service.ts).
        schoolId: input.schoolId ?? null,
        trainingCampId: input.trainingCampId ?? null,
        notes: input.notes ?? null,
      },
    });
  });
}
