"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { updateSitePoint } from "@/features/site-points";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";

export type UpdateSitePointActionState = { success: true } | { success: false; error: string };

export async function updateSitePointAction(
  sitePointId: string,
  _previousState: UpdateSitePointActionState | null,
  formData: FormData,
): Promise<UpdateSitePointActionState> {
  await requireAdmin();

  try {
    await updateSitePoint(sitePointId, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la modification du point." };
  }

  redirect(withToast("/admin/site-points", "Point modifié."));
}
