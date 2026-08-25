"use server";

import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { QualificationNotFoundError, updateQualification } from "@/features/qualifications";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type UpdateQualificationActionState = { success: true } | { success: false; error: string };

// Même structure que update-training-camp.ts : qualificationId pré-lié via
// .bind(null, qualificationId), jamais fourni par le client.
export async function updateQualificationAction(
  qualificationId: string,
  _previousState: UpdateQualificationActionState | null,
  formData: FormData,
): Promise<UpdateQualificationActionState> {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await updateQualification(
      user.id,
      qualificationId,
      Object.fromEntries(formData),
      t.validation.qualification,
    );
  } catch (error) {
    if (error instanceof QualificationNotFoundError) {
      notFound();
    }
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.qualificationUpdateError };
  }

  redirect(withToast("/qualifications", t.toast.qualificationUpdated));
}
