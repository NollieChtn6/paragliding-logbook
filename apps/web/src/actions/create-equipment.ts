"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createEquipment } from "@/features/equipment";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type CreateEquipmentActionState = { success: true } | { success: false; error: string };

export async function createEquipmentAction(
  _previousState: CreateEquipmentActionState | null,
  formData: FormData,
): Promise<CreateEquipmentActionState> {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  let equipment: Awaited<ReturnType<typeof createEquipment>>;
  try {
    equipment = await createEquipment(
      user.id,
      Object.fromEntries(formData),
      t.validation.equipment,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.equipmentCreateError };
  }

  // Nomme la marque/modèle dans le toast plutôt qu'une confirmation
  // générique (critique /impeccable, P1) — même format que
  // equipment/[id]/page.tsx > entityLabel.
  redirect(
    withToast("/equipment", t.toast.equipmentCreated(`${equipment.brand} ${equipment.model}`)),
  );
}
