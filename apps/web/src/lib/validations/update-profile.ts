import { z } from "zod";

// Même règle que sur name à l'inscription (lib/validations/sign-up.ts) :
// pas de politique différente pour éditer son nom que pour le choisir.
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le prénom est obligatoire.")
    .max(100, "Le prénom ne doit pas dépasser 100 caractères."),
  // Facultatif : transforme la chaîne vide (champ effacé via
  // CityCombobox/showClear) en undefined, pour que Better Auth stocke null
  // plutôt qu'une chaîne vide en base.
  city: z
    .string()
    .trim()
    .max(100, "La ville ne doit pas dépasser 100 caractères.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
