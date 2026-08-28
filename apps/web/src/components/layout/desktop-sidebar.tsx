"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/locale-provider";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { VersionBadge } from "@/components/version-badge";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { AddEntrySheet } from "./add-entry-sheet";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";

const ITEM_CLASSNAME = "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors";

type DesktopSidebarProps = {
  city?: string | null;
};

// Colonne fixe visible à partir de md, masquée en dessous (MobileBottomNav
// prend le relais). Porte la marque, la navigation, et le thème/déconnexion
// en pied — MobileBottomNav n'a que la navigation, ces deux actions vivent
// dans la bande haute mobile d'AppShell. Jamais rendue pour un rôle ADMIN
// (voir app-shell.tsx), donc pas de lien Administration ici.
export function DesktopSidebar({ city }: DesktopSidebarProps) {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="hidden w-60 flex-none flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
      <div className="mb-6 flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-sidebar-foreground"
        >
          <span
            className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-base"
            aria-hidden
          >
            🪂
          </span>
          THERMIK
        </Link>
        {/* pl-10 aligne sous le texte (badge size-8 + gap-2 = 40px = pl-10) :
        n'apparaît que si l'utilisateur a renseigné sa ville sur son profil
        (facultatif, voir features/account/profile-form.tsx). */}
        {city && (
          <span className="flex items-center gap-1 pl-10 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden />
            {city}
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          const stateClassName = active
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

          // "Ajouter" ouvre une feuille de choix (Activité/Brevet/Matériel)
          // plutôt que de naviguer directement vers /activities/new : voir
          // add-entry-sheet.tsx.
          if (item.labelKey === "navAdd") {
            return (
              <AddEntrySheet
                key={item.href}
                triggerClassName={cn(ITEM_CLASSNAME, "w-full text-left", stateClassName)}
                trigger={
                  <>
                    <Icon className="size-4" />
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
              className={cn(ITEM_CLASSNAME, stateClassName)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4" />
              {t.shell[item.labelKey]}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleToggle />
        </div>
        <AccountMenu trigger="full" />
      </div>
      <VersionBadge className="mt-2 text-center" />
    </aside>
  );
}
