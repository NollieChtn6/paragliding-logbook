import { z } from "zod";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : on la normalise en undefined avant validation.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

// Règles métier docs/domain-model.md (Gonflage) :
// - durée strictement positive ;
// - exercices travaillés obligatoires.
export const groundHandlingSchema = z.object({
  date: z.coerce.date(),
  siteId: z.string().uuid(),
  durationMin: z.coerce.number().int().positive(),
  exercises: z.string().trim().min(1),
  difficulties: optionalTrimmedString,
  feeling: optionalTrimmedString,
});

export type GroundHandlingInput = z.infer<typeof groundHandlingSchema>;
