"use server";

import { redirect } from "next/navigation";
import { deleteSitePoint } from "@/features/site-points";
import { requireAdmin } from "@/lib/current-user";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";

export type DeleteSitePointActionState = { success: true } | { success: false; error: string };

export async function deleteSitePointAction(
  sitePointId: string,
  _previousState: DeleteSitePointActionState | null,
  _formData: FormData,
): Promise<DeleteSitePointActionState> {
  await requireAdmin();

  try {
    await deleteSitePoint(sitePointId);
  } catch (error) {
    if (error instanceof ReferenceDataInUseError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la suppression." };
  }

  redirect(withToast("/admin/site-points", "Point supprimé."));
}
