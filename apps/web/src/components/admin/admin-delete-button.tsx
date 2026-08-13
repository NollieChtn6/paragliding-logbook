"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useT } from "@/components/locale-provider";
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
// useActionState), généralisé pour les trois ressources admin (spots,
// sites, écoles) : docs/admin.md > Suppression exige une confirmation, et
// le message d'erreur (ex. "encore utilisé") doit remonter clairement plutôt
// qu'une suppression en cascade silencieuse. Déclencheur compact (icône
// seule) : pensé pour une ligne de tableau, à la différence du bouton
// "Supprimer" pleine largeur des pages d'activité.
export function AdminDeleteButton({ action, entityLabel }: AdminDeleteButtonProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const t = useT();

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
            aria-label={t.admin.deleteAriaLabel(entityLabel)}
            title={t.admin.deleteAriaLabel(entityLabel)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.admin.deleteConfirmTitle(entityLabel)}</AlertDialogTitle>
          <AlertDialogDescription>{t.admin.deleteConfirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.admin.cancel}</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction type="submit" variant="destructive" disabled={isPending}>
              {isPending ? t.admin.deleting : t.admin.delete}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
