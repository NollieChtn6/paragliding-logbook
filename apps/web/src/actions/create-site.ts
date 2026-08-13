"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type CreateSiteActionState = { success: true } | { success: false; error: string };

export async function createSiteAction(
  _previousState: CreateSiteActionState | null,
  formData: FormData,
): Promise<CreateSiteActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await createSite(Object.fromEntries(formData), t.validation.site);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.siteCreateError };
  }

  redirect(withToast("/admin/sites", t.toast.siteCreated));
}
