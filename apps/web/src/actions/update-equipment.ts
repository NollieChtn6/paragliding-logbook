"use server";

import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { EquipmentNotFoundError, updateEquipment } from "@/features/equipment";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type UpdateEquipmentActionState = { success: true } | { success: false; error: string };

// Même structure que update-qualification.ts : equipmentId pré-lié via
// .bind(null, equipmentId), jamais fourni par le client.
export async function updateEquipmentAction(
  equipmentId: string,
  _previousState: UpdateEquipmentActionState | null,
  formData: FormData,
): Promise<UpdateEquipmentActionState> {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await updateEquipment(
      user.id,
      equipmentId,
      Object.fromEntries(formData),
      t.validation.equipment,
    );
  } catch (error) {
    if (error instanceof EquipmentNotFoundError) {
      notFound();
    }
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.equipmentUpdateError };
  }

  redirect(withToast("/equipment", t.toast.equipmentUpdated));
}
