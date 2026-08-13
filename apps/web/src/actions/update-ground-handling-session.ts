"use server";

import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { updateGroundHandlingSession } from "@/features/ground-handling-sessions";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type UpdateGroundHandlingSessionActionState =
  | { success: true }
  | { success: false; error: string };

// Même structure que update-flight.ts : activityId pré-lié via
// .bind(null, activityId), jamais fourni par le client.
export async function updateGroundHandlingSessionAction(
  activityId: string,
  _previousState: UpdateGroundHandlingSessionActionState | null,
  formData: FormData,
): Promise<UpdateGroundHandlingSessionActionState> {
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await updateGroundHandlingSession(
      user.id,
      activityId,
      Object.fromEntries(formData),
      t.validation.groundHandling,
    );
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      notFound();
    }
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.groundHandlingSessionUpdateError };
  }

  redirect(withToast(`/activities/${activityId}`, t.toast.groundHandlingSessionUpdated));
}
