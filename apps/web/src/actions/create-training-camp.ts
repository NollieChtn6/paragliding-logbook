"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createTrainingCamp } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";

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

  try {
    await createTrainingCamp(user.id, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la création du stage." };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter.
  redirect(withToast("/activities", "Stage créé."));
}
