"use server";

import { DEV_USER_EMAIL } from "@/lib/dev-fixtures";
import { prisma } from "@/lib/prisma";
import { createFlight } from "@/repositories/flight-repository";
import { createFlightSchema } from "@/schemas/flight";

export type CreateFlightActionState = { success: true } | { success: false; error: string };

export async function createFlightAction(
  _previousState: CreateFlightActionState | null,
  formData: FormData,
): Promise<CreateFlightActionState> {
  const parsed = createFlightSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  // Pas d'Auth.js pour l'instant : utilisateur de développement créé par le seed.
  const devUser = await prisma.user.findUnique({ where: { email: DEV_USER_EMAIL } });
  if (!devUser) {
    return {
      success: false,
      error: "Utilisateur de développement introuvable, lancer `pnpm prisma:seed`.",
    };
  }

  try {
    await createFlight(devUser.id, parsed.data);
    return { success: true };
  } catch {
    return { success: false, error: "Erreur lors de la création du vol." };
  }
}
