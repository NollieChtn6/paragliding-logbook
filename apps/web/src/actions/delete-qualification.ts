"use server";

import { redirect } from "next/navigation";
import { deleteQualification } from "@/features/qualifications";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type DeleteQualificationActionState = { success: true } | { success: false; error: string };

export async function deleteQualificationAction(
  qualificationId: string,
  _previousState: DeleteQualificationActionState | null,
  _formData: FormData,
): Promise<DeleteQualificationActionState> {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await deleteQualification(user.id, qualificationId);
  } catch {
    return { success: false, error: t.toast.deleteError };
  }

  redirect(withToast("/qualifications", t.toast.qualificationDeleted));
}
