"use server";

import { redirect } from "next/navigation";
import { deleteSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";

export type DeleteSchoolActionState = { success: true } | { success: false; error: string };

export async function deleteSchoolAction(
  schoolId: string,
  _previousState: DeleteSchoolActionState | null,
  _formData: FormData,
): Promise<DeleteSchoolActionState> {
  await requireAdmin();

  try {
    await deleteSchool(schoolId);
  } catch (error) {
    if (error instanceof ReferenceDataInUseError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur lors de la suppression." };
  }

  redirect(withToast("/admin/schools", "École supprimée."));
}
