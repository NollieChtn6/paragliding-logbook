"use client";

import { Award, ListChecks, Package } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useT } from "@/components/locale-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AddEntrySheetProps = {
  trigger: ReactNode;
  triggerClassName?: string;
};

// Trois destinations, pas cinq : Vol/Stage/Gonflage restent réunis sous
// "Nouvelle activité" (choix du type à l'étape 1 de NewActivityForm, voir
// activities/new/new-activity-form.tsx), donc pas dupliqués ici. Une feuille
// plutôt qu'un sixième item de navigation permanent : "Ajouter" ouvrait
// jusqu'ici /activities/new sans détour, brevets et matériel n'étaient
// atteignables qu'en passant d'abord par leur propre section (critique
// /impeccable, P2 — voir nav-items.ts pour l'ancien commentaire documentant
// ce trou).
export function AddEntrySheet({ trigger, triggerClassName }: AddEntrySheetProps) {
  const [open, setOpen] = useState(false);
  const t = useT();

  const options = [
    {
      href: "/activities/new",
      label: t.activities.newActivity,
      icon: ListChecks,
      className: "bg-primary/10 text-primary",
    },
    {
      href: "/qualifications/new",
      label: t.qualifications.newQualification,
      icon: Award,
      className: "bg-accent/15 text-accent",
    },
    {
      href: "/equipment/new",
      label: t.equipment.newEquipment,
      icon: Package,
      className: "bg-accent/15 text-accent",
    },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={triggerClassName}>{trigger}</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{t.shell.navAdd}</SheetTitle>
        </SheetHeader>
        {/* pb tient compte de la zone de sécurité iOS, même principe que
        MobileBottomNav : cette feuille remonte du bas, potentiellement
        au-dessus d'une zone d'encoche. */}
        <div className="flex flex-col gap-2 p-4 pt-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.href}
                href={option.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5"
              >
                <span
                  className={cn(
                    "flex size-9 flex-none items-center justify-center rounded-xl",
                    option.className,
                  )}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium text-foreground">{option.label}</span>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
