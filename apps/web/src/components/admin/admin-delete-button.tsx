"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect } from "react";
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

type AdminDeleteButtonActionState = { success: true } | { success: false; error: string };

type AdminDeleteButtonProps = {
  action: (
    prevState: AdminDeleteButtonActionState | null,
    formData: FormData,
  ) => Promise<AdminDeleteButtonActionState>;
  entityLabel: string;
};

// Même pattern que delete-activity-button.tsx (AlertDialog de confirmation +
// useActionState), généralisé pour les trois ressources admin (sites,
// points, écoles) : docs/admin.md > Suppression exige une confirmation, et
// le message d'erreur (ex. "encore utilisé") doit remonter clairement plutôt
// qu'une suppression en cascade silencieuse. Déclencheur compact (icône
// seule) : pensé pour une ligne de tableau, à la différence du bouton
// "Supprimer" pleine largeur des pages d'activité.
export function AdminDeleteButton({ action, entityLabel }: AdminDeleteButtonProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success === false) {
      toast.add({ title: state.error, type: "error" });
    }
  }, [state]);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Supprimer ${entityLabel}`}
            title={`Supprimer ${entityLabel}`}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {entityLabel} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est définitive et ne peut pas être annulée.
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
      </AlertDialogContent>
    </AlertDialog>
  );
}
