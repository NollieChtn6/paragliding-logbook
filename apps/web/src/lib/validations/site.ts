import { z } from "zod";
import type { Messages } from "@/messages";

// Schéma de création/modification d'un Site depuis /admin/sites — à
// distinguer de site-search.ts (recherche côté formulaire de vol).
// orientationDeg : cap en degrés (0-360), pertinent pour un décollage, pas
// nécessairement pour un atterrissage (schema.prisma) — reste optionnel
// pour les deux types, le formulaire n'impose pas la distinction.
export function siteSchema(t: Messages["validation"]["site"]) {
  const optionalOrientation = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number(t.orientationInvalid)
      .int(t.orientationInteger)
      .min(0, t.orientationRange)
      .max(360, t.orientationRange)
      .optional(),
  );

  return z.object({
    label: z.string().trim().min(1, t.labelRequired).max(200, t.labelTooLong),
    spotId: z.string().uuid(t.spotInvalid),
    // Table de référence (SiteType), pas un champ texte libre (docs/admin.md >
    // Gestion des sites) : l'existence et le code (TAKEOFF/LANDING) sont
    // vérifiés dans le service, qui a besoin d'une lecture en base.
    siteTypeId: z.string().uuid(t.siteTypeInvalid),
    latitude: z.coerce.number(t.latitudeInvalid).min(-90, t.latitudeRange).max(90, t.latitudeRange),
    longitude: z.coerce
      .number(t.longitudeInvalid)
      .min(-180, t.longitudeRange)
      .max(180, t.longitudeRange),
    altitudeM: z.coerce.number(t.altitudeInvalid).int(t.altitudeInteger),
    orientationDeg: optionalOrientation,
  });
}

export type SiteInput = z.infer<ReturnType<typeof siteSchema>>;
