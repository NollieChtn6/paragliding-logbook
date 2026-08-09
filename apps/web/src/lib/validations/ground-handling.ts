import { z } from "zod";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : on la normalise en undefined avant validation.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid("Le stage sélectionné est invalide.").optional(),
);

// "YYYY-MM-DD" + "HH:mm" combinées en un seul Date UTC littéral, même
// principe que lib/validations/flight.ts (voir son commentaire pour le
// détail du raisonnement fuseau horaire).
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// Règles métier docs/domain-model.md (Gonflage) :
// - durée strictement positive ;
// - exercices travaillés obligatoires.
// trainingCampId : optionnel, exposé dans GroundHandlingSessionForm ("Stage
// associé") — la règle "date de la séance dans l'intervalle du stage" est
// validée dans create-ground-handling-session.service.ts, pas ici (nécessite
// de lire le TrainingCamp en base, hors de portée d'un schéma Zod pur).
export const groundHandlingSchema = z
  .object({
    date: z.string().regex(dateRegex, "La date de la séance est invalide."),
    // Obligatoire (comme date) : permet d'ordonner plusieurs séances le
    // même jour, même raisonnement que flightSchema.
    time: z.string().regex(timeRegex, "L'heure de la séance est invalide."),
    siteId: z.string().uuid("Le site sélectionné est invalide."),
    trainingCampId: optionalUuid,
    durationMin: z.coerce
      .number("La durée doit être un nombre de minutes.")
      .int("La durée doit être un nombre entier de minutes.")
      .positive("La durée doit être strictement positive."),
    exercises: z.string().trim().min(1, "Les exercices travaillés sont obligatoires."),
    difficulties: optionalTrimmedString,
    feeling: optionalTrimmedString,
  })
  .transform(({ time, ...rest }) => ({
    ...rest,
    date: new Date(`${rest.date}T${time}:00.000Z`),
  }));

export type GroundHandlingInput = z.infer<typeof groundHandlingSchema>;
