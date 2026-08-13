"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { updateSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type UpdateSiteActionState = { success: true } | { success: false; error: string };

export async function updateSiteAction(
  siteId: string,
  _previousState: UpdateSiteActionState | null,
  formData: FormData,
): Promise<UpdateSiteActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await updateSite(siteId, Object.fromEntries(formData), t.validation.site);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.siteUpdateError };
  }

  redirect(withToast("/admin/sites", t.toast.siteUpdated));
}
