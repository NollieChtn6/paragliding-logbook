"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createFlight } from "@/features/flights";
import { getCurrentUser } from "@/lib/current-user";

export type CreateFlightActionState = { success: true } | { success: false; error: string };

export async function createFlightAction(
  _previousState: CreateFlightActionState | null,
  formData: FormData,
): Promise<CreateFlightActionState> {
  const devUser = await getCurrentUser();
  if (!devUser) {
    return {
      success: false,
      error: "Utilisateur de développement introuvable, lancer `pnpm prisma:seed`.",
    };
  }

  try {
    await createFlight(devUser.id, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la création du vol." };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter.
  redirect("/");
}
