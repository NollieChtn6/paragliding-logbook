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

type QualificationDeleteButtonActionState = { success: true } | { success: false; error: string };

type QualificationDeleteButtonProps = {
  action: (
    prevState: QualificationDeleteButtonActionState | null,
    formData: FormData,
  ) => Promise<QualificationDeleteButtonActionState>;
  entityLabel: string;
};

// Même pattern que AdminDeleteButton (components/admin/admin-delete-button.tsx),
// avec les libellés qualifications.* : ce n'est pas une ressource admin, un
// pilote supprime ses propres brevets.
export function QualificationDeleteButton({ action, entityLabel }: QualificationDeleteButtonProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const t = useT();
  const tq = t.qualifications;

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
            aria-label={tq.deleteButton}
            title={tq.deleteButton}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tq.deleteConfirmTitle(entityLabel)}</AlertDialogTitle>
          <AlertDialogDescription>{tq.deleteConfirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tq.cancel}</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction type="submit" variant="destructive" disabled={isPending}>
              {isPending ? tq.deleting : tq.deleteButton}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
        {state?.success === false && <p className="text-sm text-destructive">{state.error}</p>}
      </AlertDialogContent>
    </AlertDialog>
  );
}
