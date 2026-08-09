"use client";

import { useActionState, useEffect } from "react";
import { deleteActivityAction } from "@/actions/delete-activity";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type DeleteActivityButtonProps = {
  activityId: string;
  entityLabel: string;
  warning?: string;
};

// warning : réservé au cas Stage avec vols/séances de gonflage rattachés
// (dissociés, pas supprimés, voir delete-activity.service.ts) — l'utilisateur
// doit le savoir avant de confirmer.
export function DeleteActivityButton({
  activityId,
  entityLabel,
  warning,
}: DeleteActivityButtonProps) {
  const [state, formAction, isPending] = useActionState(
    deleteActivityAction.bind(null, activityId),
    null,
  );

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive">Supprimer</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {entityLabel} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est définitive et ne peut pas être annulée.
            {warning && <> {warning}</>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
        {state?.success === false && <p className="text-sm text-destructive">{state.error}</p>}
      </AlertDialogContent>
    </AlertDialog>
  );
}
