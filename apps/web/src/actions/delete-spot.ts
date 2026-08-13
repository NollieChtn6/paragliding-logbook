"use server";

import { redirect } from "next/navigation";
import { deleteSpot } from "@/features/spots";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type DeleteSpotActionState = { success: true } | { success: false; error: string };

// Signature à 3 arguments : spotId pré-lié via .bind(null, spotId), même
// convention que deleteActivityAction (actions/delete-activity.ts).
export async function deleteSpotAction(
  spotId: string,
  _previousState: DeleteSpotActionState | null,
  _formData: FormData,
): Promise<DeleteSpotActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await deleteSpot(spotId, t.toast.spotInUse);
  } catch (error) {
    if (error instanceof ReferenceDataInUseError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: t.toast.deleteError };
  }

  redirect(withToast("/admin/spots", t.toast.spotDeleted));
}
