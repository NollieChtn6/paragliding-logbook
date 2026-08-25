import { z } from "zod";
import type { Messages } from "@/messages";

// "YYYY-MM-DD" (Input type="date"), même format que training-camp.ts.
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : normalisée en undefined avant validation, même principe que
// lib/validations/training-camp.ts.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

// Règle métier docs/domain-model.md (Qualification, issue #171) :
// obtainedDate ne peut pas être dans le futur. Comparaison au jour près
// (comme le fait déjà create-flight.service.ts pour comparer une date à
// l'intervalle d'un stage) : obtainedDate n'a pas d'heure (contrairement à
// Flight.date), donc pas besoin de la marge de tolérance de fuseau horaire
// utilisée dans flightSchema. qualificationTypeId : existence vérifiée dans
// le service (nécessite une lecture en base, comme trainingCampTypeId dans
// trainingCampSchema). schoolId/trainingCampId : optionnels, existence (et,
// pour trainingCampId, propriété) vérifiées dans le service — même
// limitation que trainingCampId dans flightSchema.
export function qualificationSchema(t: Messages["validation"]["qualification"]) {
  function optionalUuid(invalidMessage: string) {
    return z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().uuid(invalidMessage).optional(),
    );
  }

  return z
    .object({
      qualificationTypeId: z.string().uuid(t.typeInvalid),
      obtainedDate: z.string().regex(dateRegex, t.obtainedDateInvalid),
      schoolId: optionalUuid(t.schoolInvalid),
      trainingCampId: optionalUuid(t.trainingCampInvalid),
      notes: optionalTrimmedString,
    })
    .transform(({ obtainedDate, ...rest }) => ({
      ...rest,
      obtainedDate: new Date(`${obtainedDate}T00:00:00.000Z`),
    }))
    .refine(
      (data) =>
        data.obtainedDate.toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10),
      {
        message: t.obtainedDateInFuture,
        path: ["obtainedDate"],
      },
    );
}

export type QualificationInput = z.infer<ReturnType<typeof qualificationSchema>>;
