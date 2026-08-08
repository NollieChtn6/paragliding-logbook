import { z } from "zod";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : on la normalise en undefined avant validation.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid().optional(),
);

// Règles métier docs/domain-model.md (Gonflage) :
// - durée strictement positive ;
// - exercices travaillés obligatoires.
// trainingCampId : optionnel, exposé dans GroundHandlingSessionForm ("Stage
// associé") — la règle "date de la séance dans l'intervalle du stage" est
// validée dans create-ground-handling-session.service.ts, pas ici (nécessite
// de lire le TrainingCamp en base, hors de portée d'un schéma Zod pur).
export const groundHandlingSchema = z.object({
  date: z.coerce.date(),
  siteId: z.string().uuid(),
  trainingCampId: optionalUuid,
  durationMin: z.coerce.number().int().positive(),
  exercises: z.string().trim().min(1),
  difficulties: optionalTrimmedString,
  feeling: optionalTrimmedString,
});

export type GroundHandlingInput = z.infer<typeof groundHandlingSchema>;
