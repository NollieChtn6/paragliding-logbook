"use server";

import { notFound, redirect } from "next/navigation";
import { ZodError } from "zod";
import { ActivityNotFoundError } from "@/features/activities";
import { updateTrainingCamp } from "@/features/training-camps";
import { requireCurrentUser } from "@/lib/current-user";

export type UpdateTrainingCampActionState = { success: true } | { success: false; error: string };

// Même structure que update-flight.ts : activityId pré-lié via
// .bind(null, activityId), jamais fourni par le client.
export async function updateTrainingCampAction(
  activityId: string,
  _previousState: UpdateTrainingCampActionState | null,
  formData: FormData,
): Promise<UpdateTrainingCampActionState> {
  const user = await requireCurrentUser();

  try {
    await updateTrainingCamp(user.id, activityId, Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof ActivityNotFoundError) {
      notFound();
    }
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Formulaire invalide." };
    }
    return { success: false, error: "Erreur lors de la modification du stage." };
  }

  redirect(`/activities/${activityId}`);
}
