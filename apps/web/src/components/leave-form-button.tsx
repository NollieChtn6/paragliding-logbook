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
  title?: string;
  description?: string;
};

// Même pattern que delete-activity-button.tsx (AlertDialog de confirmation) :
// ici la destination est une simple navigation (Link), pas une Server
// Action — AlertDialogAction est un Button polymorphe, render={<Link .../>}
// fonctionne comme dans activities/[id]/page.tsx. title/description
// paramétrables : utilisé à la fois en création (/activities/new) et en
// modification (/activities/[id]/edit), où le texte par défaut
// ("la création"/"seront perdues") ne conviendrait pas — voir
// activities/[id]/edit/page.tsx pour le texte adapté à la modification.
export function LeaveFormButton({
  href = "/",
  label = "Annuler",
  title = "Abandonner la création ?",
  description = "Les informations saisies seront perdues.",
}: LeaveFormButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost">{label}</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuer la saisie</AlertDialogCancel>
          <AlertDialogAction nativeButton={false} render={<Link href={href}>Quitter</Link>} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
