"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { updateSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";

export type UpdateSchoolActionState = { success: true } | { success: false; error: string };

export async function updateSchoolAction(
  schoolId: string,
  _previousState: UpdateSchoolActionState | null,
  formData: FormData,
): Promise<UpdateSchoolActionState> {
  await requireAdmin();

  try {
    await updateSchool(schoolId, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la modification de l'école." };
  }

  redirect(withToast("/admin/schools", "École modifiée."));
}
