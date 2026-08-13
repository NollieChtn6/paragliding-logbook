import { z } from "zod";
import type { Messages } from "@/messages";

// Même règle que changePasswordSchema (lib/validations/change-password.ts) :
// pas de nouvelle politique de mot de passe pour l'inscription. email
// normalisé (trim + minuscules) comme le fait déjà Better Auth côté serveur
// (sign-up.mjs > normalizedEmail) : évite juste un aller-retour inutile pour
// une casse différente à la connexion.
export function signUpSchema(t: Messages["validation"]["signUp"]) {
  return z
    .object({
      name: z.string().trim().min(1, t.nameRequired).max(100, t.nameTooLong),
      // Même règle que city sur update-profile.ts (lib/validations/update-profile.ts).
      city: z
        .string()
        .trim()
        .max(100, t.cityTooLong)
        .optional()
        .transform((value) => (value ? value : undefined)),
      email: z.string().trim().toLowerCase().min(1, t.emailRequired).email(t.emailInvalid),
      password: z.string().min(12, t.passwordTooShort),
      confirmPassword: z.string().min(1, t.confirmPasswordRequired),
      // Vérifié pour de bon dans signUp (features/auth/sign-up.service.ts,
      // voir lib/signup-invite-code.ts) : ici, juste une chaîne transmise
      // telle quelle, l'UI (sign-up-form.tsx) garantit déjà le format via
      // InputOTP.
      inviteCode: z.string().trim().optional().default(""),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.passwordMismatch,
      path: ["confirmPassword"],
    });
}

export type SignUpInput = z.infer<ReturnType<typeof signUpSchema>>;
