import { z } from "zod";

// Valeurs alignées manuellement sur l'enum Prisma FlightType (schema.prisma) :
// cette couche de validation reste volontairement indépendante de la base de
// données, donc pas d'import de @prisma/client ici.
const FLIGHT_TYPES = ["LOCAL", "CROSS", "SOARING", "THERMAL", "TRAINING", "OTHER"] as const;

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : on la normalise en undefined avant validation.
const optionalUuid = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid().optional(),
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
// arrivalPointId : même limitation, leur existence est vérifiée dans le
// service (nécessite une lecture en base).
export const flightSchema = z
  .object({
    date: z.coerce.date(),
    departurePointId: z.string().uuid(),
    arrivalPointId: z.string().uuid(),
    trainingCampId: optionalUuid,
    durationMin: z.coerce.number().int().positive(),
    flightType: z.enum(FLIGHT_TYPES),
    observations: z.string().trim().min(1),
    improvementPoints: z.string().trim().min(1),
  })
  // `new Date()` évalué à chaque validation (et non figé au chargement du
  // module) pour rester correct sur un process serveur longue durée.
  .refine((data) => data.date <= new Date(), {
    message: "La date du vol ne peut pas être dans le futur.",
    path: ["date"],
  });

export type FlightInput = z.infer<typeof flightSchema>;
