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

type EquipmentDeleteButtonActionState = { success: true } | { success: false; error: string };

type EquipmentDeleteButtonProps = {
  action: (
    prevState: EquipmentDeleteButtonActionState | null,
    formData: FormData,
  ) => Promise<EquipmentDeleteButtonActionState>;
  entityLabel: string;
};

// Même pattern que QualificationDeleteButton (features/qualifications) :
// ce n'est pas une ressource admin, un pilote supprime son propre matériel.
// L'erreur affichée peut être ReferenceDataInUseError (t.toast.equipmentInUse,
// voir actions/delete-equipment.ts) : le message explique déjà comment
// procéder (marquer comme vendu/retiré), pas besoin d'un traitement dédié
// ici, state.error suffit tel quel.
export function EquipmentDeleteButton({ action, entityLabel }: EquipmentDeleteButtonProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const t = useT();
  const te = t.equipment;

  useEffect(() => {
    if (state?.success === false) {
      toast.add({
        title: state.error,
        description: t.common.deleteRetryReassurance,
        type: "error",
      });
    }
  }, [state, t]);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={te.deleteButtonFor(entityLabel)}
            title={te.deleteButtonFor(entityLabel)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{te.deleteConfirmTitle(entityLabel)}</AlertDialogTitle>
          <AlertDialogDescription>{te.deleteConfirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{te.cancel}</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction type="submit" variant="destructive" disabled={isPending}>
              {isPending ? te.deleting : te.deleteButton}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
        {state?.success === false && <p className="text-sm text-destructive">{state.error}</p>}
      </AlertDialogContent>
    </AlertDialog>
  );
}
