"use client";

import Link from "next/link";
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
export function LeaveFormButton({ href = "/", label, title, description }: LeaveFormButtonProps) {
  const t = useT();
  const resolvedLabel = label ?? t.common.cancel;
  const resolvedTitle = title ?? t.common.discardCreationTitle;
  const resolvedDescription = description ?? t.common.discardCreationDescription;

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost">{resolvedLabel}</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{resolvedTitle}</AlertDialogTitle>
          <AlertDialogDescription>{resolvedDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.continueEditing}</AlertDialogCancel>
          <AlertDialogAction
            nativeButton={false}
            render={<Link href={href}>{t.common.leave}</Link>}
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
