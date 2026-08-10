"use server";

import { headers } from "next/headers";
import { ZodError } from "zod";
import { updateProfile } from "@/features/account";
import { requireCurrentUser } from "@/lib/current-user";

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

  try {
    await updateProfile(await headers(), Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la mise à jour du profil." };
  }

  return { success: true };
}
