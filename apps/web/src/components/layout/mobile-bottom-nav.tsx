"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";
import { AddEntrySheet } from "./add-entry-sheet";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";

const ITEM_CLASSNAME =
  "flex flex-1 flex-col items-center gap-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-xs";

// Barre de navigation basse, seule visible en dessous de md (DesktopSidebar
// prend le relais au-delà). pb tient compte de la zone de sécurité iOS.
export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card shadow-[0_-1px_10px_rgba(0,0,0,0.06)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = item.icon;

        // "Ajouter" ouvre une feuille de choix (Activité/Brevet/Matériel)
        // plutôt que de naviguer directement vers /activities/new : voir
        // add-entry-sheet.tsx.
        if (item.labelKey === "navAdd") {
          return (
            <AddEntrySheet
              key={item.href}
              triggerClassName={cn(
                ITEM_CLASSNAME,
                active ? "font-medium text-primary" : "text-muted-foreground",
              )}
              trigger={
                <>
                  <Icon className="size-5" />
                  {t.shell[item.labelKey]}
                </>
              }
            />
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              ITEM_CLASSNAME,
              active ? "font-medium text-primary" : "text-muted-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-5" />
            {t.shell[item.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}
