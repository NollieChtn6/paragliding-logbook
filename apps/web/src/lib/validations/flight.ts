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
// Pas de règle comparant les altitudes de décollage/atterrissage : depuis
// l'évolution Site/SitePoint, takeoffPoint et landingPoint peuvent
// appartenir à des sites différents (ex. cross qui atterrit sur le
// décollage d'un autre site, potentiellement plus haut) — la contrainte
// "décollage > atterrissage" n'a plus de sens.
// trainingCampId : optionnel, exposé dans FlightForm ("Stage associé") — la
// règle "date du vol dans l'intervalle du stage" est validée dans
// create-flight.service.ts, pas ici (nécessite de lire le TrainingCamp en
// base, hors de portée d'un .refine() Zod pur). takeoffPointId/
// landingPointId/flightTypeId : même limitation — leur existence ET, pour
// les points, leur type (TAKEOFF/LANDING respectivement,
// docs/decisions/005-flight-takeoff-landing-points.md) sont vérifiés dans
// le service (nécessite une lecture en base).
export const flightSchema = z
  .object({
    date: z.coerce.date("La date du vol est invalide."),
    takeoffPointId: z.string().uuid("Le point de décollage est invalide."),
    landingPointId: z.string().uuid("Le point d'atterrissage est invalide."),
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
