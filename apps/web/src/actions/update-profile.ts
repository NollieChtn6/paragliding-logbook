"use server";

import { headers } from "next/headers";
import { ZodError } from "zod";
import { updateProfile } from "@/features/account";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

export type UpdateProfileActionState = { success: true } | { success: false; error: string };

// Pas de redirect() en cas de succès, même principe que changePasswordAction :
// pas de "page suivante", l'utilisateur reste sur /settings/security (voir
// ProfileForm pour l'état de succès affiché côté client).
export async function updateProfileAction(
  _previousState: UpdateProfileActionState | null,
  formData: FormData,
): Promise<UpdateProfileActionState> {
  // Hors du try/catch : requireCurrentUser() redirige si pas de session, ce
  // que le catch générique ci-dessous ne doit pas intercepter. Sert de garde
  // d'autorisation même si updateProfile() ne prend pas userId en paramètre :
  // auth.api.updateUser résout lui-même la session à partir de headers (voir
  // update-profile.service.ts).
  await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await updateProfile(await headers(), Object.fromEntries(formData), t.validation.updateProfile);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.profileUpdateError };
  }

  return { success: true };
}
