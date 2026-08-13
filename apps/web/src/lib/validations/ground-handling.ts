import { z } from "zod";
import type { Messages } from "@/messages";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : on la normalise en undefined avant validation.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
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
export function groundHandlingSchema(t: Messages["validation"]["groundHandling"]) {
  const optionalUuid = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().uuid(t.trainingCampInvalid).optional(),
  );

  return z
    .object({
      date: z.string().regex(dateRegex, t.dateInvalid),
      // Obligatoire (comme date) : permet d'ordonner plusieurs séances le
      // même jour, même raisonnement que flightSchema.
      time: z.string().regex(timeRegex, t.timeInvalid),
      spotId: z.string().uuid(t.spotInvalid),
      trainingCampId: optionalUuid,
      durationMin: z.coerce
        .number(t.durationInvalid)
        .int(t.durationInteger)
        .positive(t.durationPositive),
      exercises: z.string().trim().min(1, t.exercisesRequired),
      difficulties: optionalTrimmedString,
      feeling: optionalTrimmedString,
    })
    .transform(({ time, ...rest }) => ({
      ...rest,
      date: new Date(`${rest.date}T${time}:00.000Z`),
    }));
}

export type GroundHandlingInput = z.infer<ReturnType<typeof groundHandlingSchema>>;
