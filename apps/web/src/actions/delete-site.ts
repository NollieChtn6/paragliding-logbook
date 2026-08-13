"use server";

import { redirect } from "next/navigation";
import { deleteSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type DeleteSiteActionState = { success: true } | { success: false; error: string };

export async function deleteSiteAction(
  siteId: string,
  _previousState: DeleteSiteActionState | null,
  _formData: FormData,
): Promise<DeleteSiteActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await deleteSite(siteId, t.toast.siteInUse);
  } catch (error) {
    if (error instanceof ReferenceDataInUseError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: t.toast.deleteError };
  }

  redirect(withToast("/admin/sites", t.toast.siteDeleted));
}
