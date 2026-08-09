import { z } from "zod";

// currentPassword/newPassword vérifiés côté serveur (auth.api.changePassword,
// features/account/change-password.service.ts) — cette validation ne fait
// que la forme et les règles exprimables sans accès à la base.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est obligatoire."),
    newPassword: z
      .string()
      .min(12, "Le nouveau mot de passe doit contenir au moins 12 caractères."),
    confirmPassword: z.string().min(1, "La confirmation est obligatoire."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "La confirmation ne correspond pas au nouveau mot de passe.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
