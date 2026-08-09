import { z } from "zod";

// Même règle que changePasswordSchema (lib/validations/change-password.ts) :
// pas de nouvelle politique de mot de passe pour l'inscription. email
// normalisé (trim + minuscules) comme le fait déjà Better Auth côté serveur
// (sign-up.mjs > normalizedEmail) : évite juste un aller-retour inutile pour
// une casse différente à la connexion.
export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Le nom est obligatoire.")
      .max(100, "Le nom ne doit pas dépasser 100 caractères."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "L'adresse email est obligatoire.")
      .email("L'adresse email est invalide."),
    password: z.string().min(12, "Le mot de passe doit contenir au moins 12 caractères."),
    confirmPassword: z.string().min(1, "La confirmation est obligatoire."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "La confirmation ne correspond pas au mot de passe.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
