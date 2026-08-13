"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createGroundHandlingSession } from "@/features/ground-handling-sessions";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type CreateGroundHandlingSessionActionState =
  | { success: true }
  | { success: false; error: string };

export async function createGroundHandlingSessionAction(
  _previousState: CreateGroundHandlingSessionActionState | null,
  formData: FormData,
): Promise<CreateGroundHandlingSessionActionState> {
  // Hors du try/catch : requireCurrentUser() redirige (via next/navigation)
  // si pas de session, ce que le catch générique ci-dessous ne doit pas
  // intercepter (proxy.ts protège déjà /activities/new, mais une Server
  // Function doit toujours vérifier par elle-même, cf. src/proxy.ts).
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await createGroundHandlingSession(
      user.id,
      Object.fromEntries(formData),
      t.validation.groundHandling,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.groundHandlingSessionCreateError };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter.
  redirect(withToast("/activities", t.toast.groundHandlingSessionCreated));
}
