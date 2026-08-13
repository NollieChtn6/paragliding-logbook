import { z } from "zod";
import type { Messages } from "@/messages";

// Même règle que sur name à l'inscription (lib/validations/sign-up.ts) :
// pas de politique différente pour éditer son nom que pour le choisir.
export function updateProfileSchema(t: Messages["validation"]["updateProfile"]) {
  return z.object({
    name: z.string().trim().min(1, t.nameRequired).max(100, t.nameTooLong),
    // Facultatif : transforme la chaîne vide (champ effacé via
    // CityCombobox/showClear) en undefined, pour que Better Auth stocke null
    // plutôt qu'une chaîne vide en base.
    city: z
      .string()
      .trim()
      .max(100, t.cityTooLong)
      .optional()
      .transform((value) => (value ? value : undefined)),
  });
}

export type UpdateProfileInput = z.infer<ReturnType<typeof updateProfileSchema>>;
