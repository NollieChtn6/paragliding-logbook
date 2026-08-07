import { z } from "zod";

// Valeurs alignées manuellement sur l'enum Prisma FlightType (schema.prisma) :
// cette couche de validation reste volontairement indépendante de la base de
// données, donc pas d'import de @prisma/client ici.
const FLIGHT_TYPES = ["LOCAL", "CROSS", "SOARING", "THERMAL", "TRAINING", "OTHER"] as const;

// Règles métier docs/domain-model.md (Vol) :
// - durée strictement positive ;
// - altitude de décollage supérieure à l'altitude d'atterrissage ;
// - observations et points d'amélioration obligatoires (suivi de progression).
export const flightSchema = z
  .object({
    date: z.coerce.date(),
    siteId: z.string().uuid(),
    takeoffAltitudeM: z.coerce.number().int(),
    landingAltitudeM: z.coerce.number().int(),
    durationMin: z.coerce.number().int().positive(),
    flightType: z.enum(FLIGHT_TYPES),
    observations: z.string().trim().min(1),
    improvementPoints: z.string().trim().min(1),
  })
  .refine((data) => data.takeoffAltitudeM > data.landingAltitudeM, {
    message: "L'altitude de décollage doit être supérieure à l'altitude d'atterrissage.",
    path: ["takeoffAltitudeM"],
  });

export type FlightInput = z.infer<typeof flightSchema>;
