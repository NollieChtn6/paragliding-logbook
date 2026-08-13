"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { updateSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type UpdateSchoolActionState = { success: true } | { success: false; error: string };

export async function updateSchoolAction(
  schoolId: string,
  _previousState: UpdateSchoolActionState | null,
  formData: FormData,
): Promise<UpdateSchoolActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await updateSchool(schoolId, Object.fromEntries(formData), t.validation.school);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.schoolUpdateError };
  }

  redirect(withToast("/admin/schools", t.toast.schoolUpdated));
}
