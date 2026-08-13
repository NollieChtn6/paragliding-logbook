import { z } from "zod";
import type { Messages } from "@/messages";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : on la normalise en undefined avant validation, comme le fait
// implicitement HTML pour un champ absent.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

// Règle métier docs/domain-model.md (Stage) : startDate <= endDate. L'autre
// règle métier ("les vols associés doivent avoir une date comprise dans
// l'intervalle du stage") ne peut pas être exprimée ici : elle porte sur une
// entité différente (Flight) et nécessite de lire les dates du stage en base
// — voir la validation dans create-flight.service.ts.
export function trainingCampSchema(t: Messages["validation"]["trainingCamp"]) {
  return z
    .object({
      startDate: z.coerce.date(t.startDateInvalid),
      endDate: z.coerce.date(t.endDateInvalid),
      schoolId: z.string().uuid(t.schoolInvalid),
      trainingCampTypeId: z.string().uuid(t.typeInvalid),
      observations: optionalTrimmedString,
      summary: optionalTrimmedString,
      certification: optionalTrimmedString,
    })
    .refine((data) => data.startDate <= data.endDate, {
      message: t.startDateAfterEndDate,
      path: ["startDate"],
    });
}

export type TrainingCampInput = z.infer<ReturnType<typeof trainingCampSchema>>;
