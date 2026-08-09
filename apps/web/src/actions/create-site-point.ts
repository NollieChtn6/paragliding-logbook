"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createSitePoint } from "@/features/site-points";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";

export type CreateSitePointActionState = { success: true } | { success: false; error: string };

export async function createSitePointAction(
  _previousState: CreateSitePointActionState | null,
  formData: FormData,
): Promise<CreateSitePointActionState> {
  await requireAdmin();

  try {
    await createSitePoint(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la création du point." };
  }

  redirect(withToast("/admin/site-points", "Point créé."));
}
