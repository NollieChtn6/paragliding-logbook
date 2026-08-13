import { z } from "zod";
import type { Messages } from "@/messages";

// currentPassword/newPassword vérifiés côté serveur (auth.api.changePassword,
// features/account/change-password.service.ts) — cette validation ne fait
// que la forme et les règles exprimables sans accès à la base.
export function changePasswordSchema(t: Messages["validation"]["changePassword"]) {
  return z
    .object({
      currentPassword: z.string().min(1, t.currentPasswordRequired),
      newPassword: z.string().min(12, t.newPasswordTooShort),
      confirmPassword: z.string().min(1, t.confirmPasswordRequired),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t.passwordMismatch,
      path: ["confirmPassword"],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: t.passwordSameAsCurrent,
      path: ["newPassword"],
    });
}

export type ChangePasswordInput = z.infer<ReturnType<typeof changePasswordSchema>>;
