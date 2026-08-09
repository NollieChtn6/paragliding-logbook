import Link from "next/link";
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

type LeaveFormButtonProps = {
  href?: string;
  label?: string;
};

// Même pattern que delete-activity-button.tsx (AlertDialog de confirmation) :
// ici la destination est une simple navigation (Link), pas une Server
// Action — AlertDialogAction est un Button polymorphe, render={<Link .../>}
// fonctionne comme dans activities/[id]/page.tsx.
export function LeaveFormButton({ href = "/", label = "Annuler" }: LeaveFormButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost">{label}</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abandonner la création ?</AlertDialogTitle>
          <AlertDialogDescription>Les informations saisies seront perdues.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuer la saisie</AlertDialogCancel>
          <AlertDialogAction render={<Link href={href}>Quitter</Link>} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
