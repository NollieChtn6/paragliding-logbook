"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createFlight } from "@/features/flights";
import { DEV_USER_EMAIL } from "@/lib/dev-fixtures";
import { prisma } from "@/lib/prisma";

export type CreateFlightActionState = { success: true } | { success: false; error: string };

export async function createFlightAction(
  _previousState: CreateFlightActionState | null,
  formData: FormData,
): Promise<CreateFlightActionState> {
  // Pas d'Auth.js pour l'instant : utilisateur de développement créé par le seed.
  const devUser = await prisma.user.findUnique({ where: { email: DEV_USER_EMAIL } });
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
