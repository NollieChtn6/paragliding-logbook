import { z } from "zod";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : normalisée en undefined avant validation, même principe que
// lib/validations/training-camp.ts.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

// Code pays ISO 3166-1 alpha-2 (docs/decisions/004-editable-referentials.md),
// normalisé en majuscules avant validation. Même règle que lib/validations/site.ts.
const optionalCountryCode = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() !== "" ? value.trim().toUpperCase() : undefined,
  z
    .string()
    .length(2, "Le code pays doit contenir exactement 2 lettres (ex. FR).")
    .regex(/^[A-Z]{2}$/, "Le code pays doit contenir exactement 2 lettres (ex. FR).")
    .optional(),
);

function optionalCoordinate(min: number, max: number, label: string) {
  return z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number(`${label} doit être un nombre.`)
      .min(min, `${label} doit être comprise entre ${min} et ${max}.`)
      .max(max, `${label} doit être comprise entre ${min} et ${max}.`)
      .optional(),
  );
}

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url("Le site web doit être une URL valide (ex. https://exemple.fr).").optional(),
);

export const schoolSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire.")
    .max(200, "Le nom ne doit pas dépasser 200 caractères."),
  address: optionalTrimmedString,
  postalCode: optionalTrimmedString,
  city: optionalTrimmedString,
  countryCode: optionalCountryCode,
  latitude: optionalCoordinate(-90, 90, "La latitude"),
  longitude: optionalCoordinate(-180, 180, "La longitude"),
  website: optionalUrl,
});

export type SchoolInput = z.infer<typeof schoolSchema>;
