"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { updateSpot } from "@/features/spots";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";

export type UpdateSpotActionState = { success: true } | { success: false; error: string };

export async function updateSpotAction(
  spotId: string,
  _previousState: UpdateSpotActionState | null,
  formData: FormData,
): Promise<UpdateSpotActionState> {
  await requireAdmin();

  try {
    await updateSpot(spotId, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la modification du spot." };
  }

  redirect(withToast("/admin/spots", "Spot modifié."));
}
