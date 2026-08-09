"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createSchool } from "@/features/schools";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";

export type CreateSchoolActionState = { success: true } | { success: false; error: string };

export async function createSchoolAction(
  _previousState: CreateSchoolActionState | null,
  formData: FormData,
): Promise<CreateSchoolActionState> {
  await requireAdmin();

  try {
    await createSchool(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la création de l'école." };
  }

  redirect(withToast("/admin/schools", "École créée."));
}
