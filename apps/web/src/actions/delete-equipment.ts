"use server";

import { notFound, redirect } from "next/navigation";
import { deleteEquipment, EquipmentNotFoundError } from "@/features/equipment";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type DeleteEquipmentActionState = { success: true } | { success: false; error: string };

export async function deleteEquipmentAction(
  equipmentId: string,
  _previousState: DeleteEquipmentActionState | null,
  _formData: FormData,
): Promise<DeleteEquipmentActionState> {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await deleteEquipment(user.id, equipmentId, t.toast.equipmentInUse);
  } catch (error) {
    // Même traitement que updateEquipmentAction : un id inexistant ou déjà
    // supprimé (ex. double clic depuis deux onglets) doit retomber sur la
    // page 404, pas sur un toast d'erreur générique.
    if (error instanceof EquipmentNotFoundError) {
      notFound();
    }
    if (error instanceof ReferenceDataInUseError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: t.toast.deleteError };
  }

  redirect(withToast("/equipment", t.toast.equipmentDeleted));
}
