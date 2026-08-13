"use server";

import { redirect } from "next/navigation";
import { deleteSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type DeleteSchoolActionState = { success: true } | { success: false; error: string };

export async function deleteSchoolAction(
  schoolId: string,
  _previousState: DeleteSchoolActionState | null,
  _formData: FormData,
): Promise<DeleteSchoolActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await deleteSchool(schoolId, t.toast.schoolInUse);
  } catch (error) {
    if (error instanceof ReferenceDataInUseError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: t.toast.deleteError };
  }

  redirect(withToast("/admin/schools", t.toast.schoolDeleted));
}
