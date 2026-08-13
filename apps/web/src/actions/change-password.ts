"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { changePassword } from "@/features/account";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export type ChangePasswordActionState = { success: true } | { success: false; error: string };

// Pas de redirect() en cas de succès, contrairement aux autres actions :
// il n'y a pas de "page suivante", l'utilisateur reste sur
// /settings/security (voir ChangePasswordForm pour l'état de succès affiché
// côté client).
export async function changePasswordAction(
  _previousState: ChangePasswordActionState | null,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  // Hors du try/catch : requireCurrentUser() redirige si pas de session, ce
  // que le catch générique ci-dessous ne doit pas intercepter. Sert de garde
  // d'autorisation même si changePassword() ne prend pas userId en
  // paramètre : auth.api.changePassword résout lui-même la session à partir
  // de headers (voir change-password.service.ts).
  await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await changePassword(
      await headers(),
      Object.fromEntries(formData),
      t.validation.changePassword,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    // Levée par auth.api.changePassword quand currentPassword ne correspond
    // pas au hash stocké (code "INVALID_PASSWORD").
    if (error instanceof APIError) {
      return { success: false, error: t.account.invalidCurrentPassword };
    }
    return { success: false, error: t.account.changePasswordError };
  }

  return { success: true };
}
