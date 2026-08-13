"use server";

import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { updateFlight } from "@/features/flights";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type UpdateFlightActionState = { success: true } | { success: false; error: string };

// Signature à 3 arguments : activityId est pré-lié via .bind(null, activityId)
// dans la page /activities/[id]/edit (useActionState n'accepte que
// (prevState, formData), pas d'argument supplémentaire). activityId vient de
// l'URL, pas du client — la sécurité repose sur la vérification de propriété
// faite dans updateFlight, jamais sur activityId lui-même.
export async function updateFlightAction(
  activityId: string,
  _previousState: UpdateFlightActionState | null,
  formData: FormData,
): Promise<UpdateFlightActionState> {
  // Hors du try/catch : requireCurrentUser() redirige (via next/navigation)
  // si pas de session, ce que le catch générique ci-dessous ne doit pas
  // intercepter (proxy.ts protège déjà /activities/:path*, mais une Server
  // Function doit toujours vérifier par elle-même, cf. src/proxy.ts).
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await updateFlight(user.id, activityId, Object.fromEntries(formData), t.validation.flight);
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      notFound();
    }
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.flightUpdateError };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter. Vers le détail
  // modifié plutôt que /activities, pour confirmer visuellement le résultat.
  redirect(withToast(`/activities/${activityId}`, t.toast.flightUpdated));
}
