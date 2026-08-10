import { z } from "zod";

// Même règle que sur name à l'inscription (lib/validations/sign-up.ts) :
// pas de politique différente pour éditer son nom que pour le choisir.
export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire.")
    .max(100, "Le nom ne doit pas dépasser 100 caractères."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
