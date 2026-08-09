"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { updateSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";

export type UpdateSiteActionState = { success: true } | { success: false; error: string };

export async function updateSiteAction(
  siteId: string,
  _previousState: UpdateSiteActionState | null,
  formData: FormData,
): Promise<UpdateSiteActionState> {
  await requireAdmin();

  try {
    await updateSite(siteId, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la modification du site." };
  }

  redirect(withToast("/admin/sites", "Site modifié."));
}
