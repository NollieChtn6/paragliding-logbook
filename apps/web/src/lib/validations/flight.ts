import { z } from "zod";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : on la normalise en undefined avant validation.
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid("Le stage sélectionné est invalide.").optional(),
);

// Règles métier docs/domain-model.md (Vol) :
// - durée strictement positive ;
// - observations et points d'amélioration obligatoires (suivi de progression) ;
// - la date du vol ne peut pas être dans le futur.
// Pas de règle comparant les altitudes de départ/arrivée : depuis l'évolution
// Site/SitePoint, departurePoint et arrivalPoint peuvent appartenir à des
// sites différents (ex. cross qui atterrit sur le décollage d'un autre site,
// potentiellement plus haut) — la contrainte "décollage > atterrissage"
// n'a plus de sens.
// trainingCampId : optionnel, exposé dans FlightForm ("Stage associé") — la
// règle "date du vol dans l'intervalle du stage" est validée dans
// create-flight.service.ts, pas ici (nécessite de lire le TrainingCamp en
// base, hors de portée d'un .refine() Zod pur). departurePointId/
// arrivalPointId/flightTypeId : même limitation, leur existence est vérifiée
// dans le service (nécessite une lecture en base) — FlightType est
// désormais une table de référence (docs/decisions/003-reference-table-codes.md),
// plus un enum Prisma validable en mémoire.
export const flightSchema = z
  .object({
    date: z.coerce.date("La date du vol est invalide."),
    departurePointId: z.string().uuid("Le point de départ est invalide."),
    arrivalPointId: z.string().uuid("Le point d'arrivée est invalide."),
    trainingCampId: optionalUuid,
    durationMin: z.coerce
      .number("La durée doit être un nombre de minutes.")
      .int("La durée doit être un nombre entier de minutes.")
      .positive("La durée doit être strictement positive."),
    flightTypeId: z.string().uuid("Le type de vol est invalide."),
    observations: z.string().trim().min(1, "Les observations sont obligatoires."),
    improvementPoints: z.string().trim().min(1, "Les points d'amélioration sont obligatoires."),
  })
  // `new Date()` évalué à chaque validation (et non figé au chargement du
  // module) pour rester correct sur un process serveur longue durée.
  .refine((data) => data.date <= new Date(), {
    message: "La date du vol ne peut pas être dans le futur.",
    path: ["date"],
  });

export type FlightInput = z.infer<typeof flightSchema>;
