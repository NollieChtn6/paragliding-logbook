"use server";

import { notFound, redirect } from "next/navigation";
import { ActivityNotFoundError, deleteActivity } from "@/features/activities";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type DeleteActivityActionState = { success: true } | { success: false; error: string };

// Signature à 3 arguments : activityId est pré-lié via .bind(null, activityId)
// dans DeleteActivityButton (useActionState n'accepte que (prevState,
// formData), pas d'argument supplémentaire). Même convention que
// updateFlightAction (actions/update-flight.ts).
export async function deleteActivityAction(
  activityId: string,
  _previousState: DeleteActivityActionState | null,
  _formData: FormData,
): Promise<DeleteActivityActionState> {
  // Hors du try/catch : requireCurrentUser() redirige si pas de session, ce
  // que le catch générique ci-dessous ne doit pas intercepter.
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await deleteActivity(user.id, activityId);
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      notFound();
    }
    return { success: false, error: t.toast.deleteError };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter. Vers la liste :
  // l'activité n'existe plus, /activities/[id] n'a plus de sens.
  redirect(withToast("/activities", t.toast.activityDeleted));
}
