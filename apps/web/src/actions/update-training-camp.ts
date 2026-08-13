"use server";

import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { updateTrainingCamp } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type UpdateTrainingCampActionState = { success: true } | { success: false; error: string };

// Même structure que update-flight.ts : activityId pré-lié via
// .bind(null, activityId), jamais fourni par le client.
export async function updateTrainingCampAction(
  activityId: string,
  _previousState: UpdateTrainingCampActionState | null,
  formData: FormData,
): Promise<UpdateTrainingCampActionState> {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await updateTrainingCamp(
      user.id,
      activityId,
      Object.fromEntries(formData),
      t.validation.trainingCamp,
    );
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      notFound();
    }
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.trainingCampUpdateError };
  }

  redirect(withToast(`/activities/${activityId}`, t.toast.trainingCampUpdated));
}
