import { z } from "zod";

// Schéma de création/modification d'un SitePoint depuis /admin/site-points —
// à distinguer de site-point-search.ts (recherche côté formulaire de vol).
// orientationDeg : cap en degrés (0-360), pertinent pour un décollage, pas
// nécessairement pour un atterrissage (schema.prisma) — reste optionnel
// pour les deux types, le formulaire n'impose pas la distinction.
const optionalOrientation = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce
    .number("L'orientation doit être un nombre de degrés.")
    .int("L'orientation doit être un nombre entier de degrés.")
    .min(0, "L'orientation doit être comprise entre 0 et 360.")
    .max(360, "L'orientation doit être comprise entre 0 et 360.")
    .optional(),
);

export const sitePointSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire.")
    .max(200, "Le nom ne doit pas dépasser 200 caractères."),
  siteId: z.string().uuid("Le site sélectionné est invalide."),
  // Table de référence (SitePointType), pas un champ texte libre
  // (docs/admin.md > Gestion des points de site) : l'existence et le code
  // (TAKEOFF/LANDING) sont vérifiés dans le service, qui a besoin d'une
  // lecture en base.
  sitePointTypeId: z.string().uuid("Le type de point sélectionné est invalide."),
  latitude: z.coerce
    .number("La latitude doit être un nombre.")
    .min(-90, "La latitude doit être comprise entre -90 et 90.")
    .max(90, "La latitude doit être comprise entre -90 et 90."),
  longitude: z.coerce
    .number("La longitude doit être un nombre.")
    .min(-180, "La longitude doit être comprise entre -180 et 180.")
    .max(180, "La longitude doit être comprise entre -180 et 180."),
  altitudeM: z.coerce
    .number("L'altitude doit être un nombre.")
    .int("L'altitude doit être un nombre entier de mètres."),
  orientationDeg: optionalOrientation,
});

export type SitePointInput = z.infer<typeof sitePointSchema>;
