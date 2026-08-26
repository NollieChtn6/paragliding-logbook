import { z } from "zod";
import type { Messages } from "@/messages";

// "YYYY-MM-DD" (Input type="date") + "HH:mm" (Input type="time") combinées en
// un seul Date UTC littéral (pas de conversion de fuseau horaire : l'heure
// saisie est stockée telle quelle, comme la date l'était déjà avant l'ajout
// de l'heure) — voir flight-form.tsx (toDateInputValue/toTimeInputValue)
// pour la restitution en sens inverse, parfaitement réversible puisqu'on
// contrôle nous-mêmes la construction de la chaîne ISO.
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// Règles métier docs/domain-model.md (Vol) :
// - durée strictement positive ;
// - observations et points d'amélioration obligatoires (suivi de progression) ;
// - la date du vol ne peut pas être dans le futur.
// Pas de règle comparant les altitudes de décollage/atterrissage : depuis
// l'évolution Spot/Site (ADR 005 ; ADR 007 pour le renommage), takeoffPoint
// et landingPoint peuvent appartenir à des spots différents (ex. cross qui
// atterrit sur le décollage d'un autre spot, potentiellement plus haut) —
// la contrainte "décollage > atterrissage" n'a plus de sens.
// trainingCampId : optionnel, exposé dans FlightForm ("Stage associé") — la
// règle "date du vol dans l'intervalle du stage" est validée dans
// create-flight.service.ts, pas ici (nécessite de lire le TrainingCamp en
// base, hors de portée d'un .refine() Zod pur). takeoffPointId/
// landingPointId/flightTypeId : même limitation — leur existence ET, pour
// les points, leur type (TAKEOFF/LANDING respectivement,
// docs/decisions/005-flight-takeoff-landing-points.md) sont vérifiés dans
// le service (nécessite une lecture en base).
export function flightSchema(t: Messages["validation"]["flight"]) {
  function optionalUuid(invalidMessage: string) {
    return z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().uuid(invalidMessage).optional(),
    );
  }

  return (
    z
      .object({
        date: z.string().regex(dateRegex, t.dateInvalid),
        // Obligatoire (comme date) : permet d'ordonner plusieurs vols le même
        // jour, sans quoi ils seraient tous ancrés à minuit et indistinguables
        // par ordre chronologique (voir getActivityEventDate,
        // features/activities/queries.ts).
        time: z.string().regex(timeRegex, t.timeInvalid),
        takeoffPointId: z.string().uuid(t.takeoffInvalid),
        landingPointId: z.string().uuid(t.landingInvalid),
        trainingCampId: optionalUuid(t.trainingCampInvalid),
        durationMin: z.coerce
          .number(t.durationInvalid)
          .int(t.durationInteger)
          .positive(t.durationPositive),
        flightTypeId: z.string().uuid(t.flightTypeInvalid),
        // wingId/harnessId/reserveId : optionnels, existence ET type
        // (WING/HARNESS/RESERVE respectivement) vérifiés dans le service —
        // même limitation que takeoffPointId/landingPointId ci-dessus
        // (docs/domain-model.md > Règles métier > Matériel).
        wingId: optionalUuid(t.wingInvalid),
        harnessId: optionalUuid(t.harnessInvalid),
        reserveId: optionalUuid(t.reserveInvalid),
        observations: z.string().trim().min(1, t.observationsRequired),
        improvementPoints: z.string().trim().min(1, t.improvementPointsRequired),
      })
      .transform(({ time, ...rest }) => ({
        ...rest,
        date: new Date(`${rest.date}T${time}:00.000Z`),
      }))
      // Le stockage littéral ci-dessus ne capture aucun fuseau horaire : un
      // pilote à l'est de UTC (ex. France, UTC+1/+2) qui saisit l'heure
      // locale réelle d'un vol qu'il vient de faire peut se voir comparé à
      // une "date future" purement à cause du décalage, alors que le vol a
      // bien eu lieu. Une marge de tolérance couvrant le décalage le plus
      // extrême possible (UTC+14) absorbe ce cas sans affaiblir l'objectif
      // du contrôle, qui est d'attraper une erreur de saisie grossière
      // (mauvaise année, mauvais mois), pas de valider l'instant à la
      // seconde près. `Date.now()` évalué à chaque validation (et non figé
      // au chargement du module) pour rester correct sur un process
      // serveur longue durée.
      .refine((data) => data.date.getTime() <= Date.now() + 14 * 60 * 60 * 1000, {
        message: t.dateInFuture,
        path: ["date"],
      })
  );
}

export type FlightInput = z.infer<ReturnType<typeof flightSchema>>;
