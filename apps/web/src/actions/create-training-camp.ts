"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createTrainingCamp } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type CreateTrainingCampActionState = { success: true } | { success: false; error: string };

export async function createTrainingCampAction(
  _previousState: CreateTrainingCampActionState | null,
  formData: FormData,
): Promise<CreateTrainingCampActionState> {
  // Hors du try/catch : requireCurrentUser() redirige (via next/navigation)
  // si pas de session, ce que le catch générique ci-dessous ne doit pas
  // intercepter (proxy.ts protège déjà /activities/new, mais une Server
  // Function doit toujours vérifier par elle-même, cf. src/proxy.ts).
  const user = await requireCurrentUser();
  const t = getDictionary(await getLocale());

  try {
    await createTrainingCamp(user.id, Object.fromEntries(formData), t.validation.trainingCamp);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    return { success: false, error: t.toast.trainingCampCreateError };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter.
  redirect(withToast("/activities", t.toast.trainingCampCreated));
}
