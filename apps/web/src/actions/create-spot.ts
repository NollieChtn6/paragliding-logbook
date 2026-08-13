"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createSpot } from "@/features/spots";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type CreateSpotActionState = { success: true } | { success: false; error: string };

// requireAdmin() hors du try/catch : redirige (via next/navigation) si
// l'utilisateur n'est pas admin, ce que le catch générique ci-dessous ne
// doit pas intercepter (même principe que requireCurrentUser() ailleurs).
// /admin/* est déjà protégé par le layout, mais chaque Server Action doit
// revérifier par elle-même (docs/admin.md > Protection de /admin) : le
// serveur reste l'autorité, jamais uniquement la page qui l'appelle.
export async function createSpotAction(
  _previousState: CreateSpotActionState | null,
  formData: FormData,
): Promise<CreateSpotActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await createSpot(Object.fromEntries(formData), t.validation.spot);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.spotCreateError };
  }

  redirect(withToast("/admin/spots", t.toast.spotCreated));
}
