"use server";

import { redirect } from "next/navigation";
import { deleteSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";

export type DeleteSiteActionState = { success: true } | { success: false; error: string };

export async function deleteSiteAction(
  siteId: string,
  _previousState: DeleteSiteActionState | null,
  _formData: FormData,
): Promise<DeleteSiteActionState> {
  await requireAdmin();

  try {
    await deleteSite(siteId);
  } catch (error) {
    if (error instanceof ReferenceDataInUseError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la suppression." };
  }

  redirect(withToast("/admin/sites", "Site supprimé."));
}
