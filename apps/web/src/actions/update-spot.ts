"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { updateSpot } from "@/features/spots";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type UpdateSpotActionState = { success: true } | { success: false; error: string };

export async function updateSpotAction(
  spotId: string,
  _previousState: UpdateSpotActionState | null,
  formData: FormData,
): Promise<UpdateSpotActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await updateSpot(spotId, Object.fromEntries(formData), t.validation.spot);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.spotUpdateError };
  }

  redirect(withToast("/admin/spots", t.toast.spotUpdated));
}
