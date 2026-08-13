"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createFlight } from "@/features/flights";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type CreateFlightActionState = { success: true } | { success: false; error: string };

export async function createFlightAction(
  _previousState: CreateFlightActionState | null,
  formData: FormData,
): Promise<CreateFlightActionState> {
  // Hors du try/catch : requireCurrentUser() redirige (via next/navigation)
  // si pas de session, ce que le catch générique ci-dessous ne doit pas
  // intercepter (proxy.ts protège déjà /activities/new et /flights/new, mais
  // une Server Function doit toujours vérifier par elle-même, cf. proxy.ts).
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await createFlight(user.id, Object.fromEntries(formData), t.validation.flight);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.flightCreateError };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter. Vers /activities (pas
  // "/") : la page d'accueil affiche un lien "Se connecter" qui prête à
  // confusion juste après une création réussie, alors que la session est
  // toujours valide.
  redirect(withToast("/activities", t.toast.flightCreated));
}
