"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createSite } from "@/features/sites";
import { requireAdmin } from "@/lib/current-user";
import { withToast } from "@/lib/toast-redirect";

export type CreateSiteActionState = { success: true } | { success: false; error: string };

// requireAdmin() hors du try/catch : redirige (via next/navigation) si
// l'utilisateur n'est pas admin, ce que le catch générique ci-dessous ne
// doit pas intercepter (même principe que requireCurrentUser() ailleurs).
// /admin/* est déjà protégé par le layout, mais chaque Server Action doit
// revérifier par elle-même (docs/admin.md > Protection de /admin) : le
// serveur reste l'autorité, jamais uniquement la page qui l'appelle.
export async function createSiteAction(
  _previousState: CreateSiteActionState | null,
  formData: FormData,
): Promise<CreateSiteActionState> {
  await requireAdmin();

  try {
    await createSite(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la création du site." };
  }

  redirect(withToast("/admin/sites", "Site créé."));
}
