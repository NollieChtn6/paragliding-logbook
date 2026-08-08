"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createGroundHandlingSession } from "@/features/ground-handling-sessions";
import { requireCurrentUser } from "@/lib/current-user";

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

  try {
    await createGroundHandlingSession(user.id, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la création de la séance de gonflage." };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter.
  redirect("/activities");
}
