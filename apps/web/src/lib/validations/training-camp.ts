import { z } from "zod";

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
export const trainingCampSchema = z
  .object({
    startDate: z.coerce.date("La date de début est invalide."),
    endDate: z.coerce.date("La date de fin est invalide."),
    schoolId: z.string().uuid("L'école sélectionnée est invalide."),
    campType: z.string().trim().min(1, "Le type de stage est obligatoire."),
    summary: optionalTrimmedString,
    certification: optionalTrimmedString,
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "La date de début doit être antérieure ou égale à la date de fin.",
    path: ["startDate"],
  });

export type TrainingCampInput = z.infer<typeof trainingCampSchema>;
