"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type CreateSchoolActionState = { success: true } | { success: false; error: string };

export async function createSchoolAction(
  _previousState: CreateSchoolActionState | null,
  formData: FormData,
): Promise<CreateSchoolActionState> {
  await requireAdmin();
  const t = getDictionary(await getLocale());

  try {
    await createSchool(Object.fromEntries(formData), t.validation.school);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.schoolCreateError };
  }

  redirect(withToast("/admin/schools", t.toast.schoolCreated));
}
