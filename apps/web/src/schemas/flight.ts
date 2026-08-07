import { FlightType } from "@prisma/client";
import { z } from "zod";

// Règle métier docs/domain-model.md : l'altitude de décollage doit être
// supérieure à l'altitude d'atterrissage.
export const createFlightSchema = z
  .object({
    date: z.coerce.date(),
    siteId: z.string().uuid(),
    takeoffAltitudeM: z.coerce.number().int(),
    landingAltitudeM: z.coerce.number().int(),
    durationMin: z.coerce.number().int().positive(),
    flightType: z.nativeEnum(FlightType),
    observations: z.string().trim().min(1),
    improvementPoints: z.string().trim().min(1),
  })
  .refine((data) => data.takeoffAltitudeM > data.landingAltitudeM, {
    message: "L'altitude de décollage doit être supérieure à l'altitude d'atterrissage.",
    path: ["takeoffAltitudeM"],
  });

export type CreateFlightInput = z.infer<typeof createFlightSchema>;
