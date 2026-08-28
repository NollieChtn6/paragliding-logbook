"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createQualification } from "@/features/qualifications";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type CreateQualificationActionState = { success: true } | { success: false; error: string };

export async function createQualificationAction(
  _previousState: CreateQualificationActionState | null,
  formData: FormData,
): Promise<CreateQualificationActionState> {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  let qualification: Awaited<ReturnType<typeof createQualification>>;
  try {
    qualification = await createQualification(
      user.id,
      Object.fromEntries(formData),
      t.validation.qualification,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.qualificationCreateError };
  }

  // Nomme le brevet obtenu dans le toast plutôt qu'une confirmation
  // générique (critique /impeccable, P1) : voir referenceLabels.qualificationType
  // pour le même repli sur le code brut qu'ailleurs si le libellé manque.
  const typeLabel =
    t.referenceLabels.qualificationType[qualification.qualificationType.code] ??
    qualification.qualificationType.code;
  redirect(withToast("/qualifications", t.toast.qualificationCreated(typeLabel)));
}
