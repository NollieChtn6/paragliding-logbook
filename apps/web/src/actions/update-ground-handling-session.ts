"use server";

import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { updateGroundHandlingSession } from "@/features/ground-handling-sessions";
import { requireCurrentUser } from "@/lib/current-user";

export type UpdateGroundHandlingSessionActionState =
  | { success: true }
  | { success: false; error: string };

// Même structure que update-flight.ts : activityId pré-lié via
// .bind(null, activityId), jamais fourni par le client.
export async function updateGroundHandlingSessionAction(
  activityId: string,
  _previousState: UpdateGroundHandlingSessionActionState | null,
  formData: FormData,
): Promise<UpdateGroundHandlingSessionActionState> {
  const user = await requireCurrentUser();

  try {
    await updateGroundHandlingSession(user.id, activityId, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      notFound();
    }
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la modification de la séance." };
  }

  redirect(`/activities/${activityId}`);
}
