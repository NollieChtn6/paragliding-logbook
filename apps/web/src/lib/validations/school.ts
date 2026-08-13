import { z } from "zod";
import type { Messages } from "@/messages";

// FormData renvoie une chaîne vide (pas undefined) pour un champ optionnel
// laissé vide : normalisée en undefined avant validation, même principe que
// lib/validations/training-camp.ts.
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

export function schoolSchema(t: Messages["validation"]["school"]) {
  // Code pays ISO 3166-1 alpha-2 (docs/decisions/004-editable-referentials.md),
  // normalisé en majuscules avant validation. Même règle que lib/validations/site.ts.
  const optionalCountryCode = z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== "" ? value.trim().toUpperCase() : undefined,
    z
      .string()
      .length(2, t.countryCodeInvalid)
      .regex(/^[A-Z]{2}$/, t.countryCodeInvalid)
      .optional(),
  );

  function optionalCoordinate(min: number, max: number, invalid: string, range: string) {
    return z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number(invalid).min(min, range).max(max, range).optional(),
    );
  }

  const optionalUrl = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url(t.websiteInvalid).optional(),
  );

  return z.object({
    name: z.string().trim().min(1, t.nameRequired).max(200, t.nameTooLong),
    address: optionalTrimmedString,
    postalCode: optionalTrimmedString,
    city: optionalTrimmedString,
    countryCode: optionalCountryCode,
    latitude: optionalCoordinate(-90, 90, t.latitudeInvalid, t.latitudeRange),
    longitude: optionalCoordinate(-180, 180, t.longitudeInvalid, t.longitudeRange),
    website: optionalUrl,
  });
}

export type SchoolInput = z.infer<ReturnType<typeof schoolSchema>>;
