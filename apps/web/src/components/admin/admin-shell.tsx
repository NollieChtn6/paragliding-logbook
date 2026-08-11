"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { VersionBadge } from "@/components/version-badge";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, isAdminNavItemActive } from "./admin-nav-items";

// Chrome dédié à /admin (docs/admin.md > Interface, Navigation) : mêmes
// tokens/composants que AppShell (components/layout/app-shell.tsx) — pas de
// seconde identité visuelle — mais navigation propre à l'espace admin (les
// entrées de l'app principale n'ont pas leur place ici). Pas de lien
// "Retour à l'application" : un admin n'a aucun usage de l'interface des
// autres utilisateurs (app/(app)/layout.tsx y redirige vers /admin), donc
// seule la déconnexion a du sens ici. Le changement de mot de passe
// (/settings/security), lui, doit rester accessible aux deux rôles — même
// bouton icône que dans AppShell/DesktopSidebar, la page vit hors du route
// group (app), voir app/settings/layout.tsx. Pas de barre de navigation
// basse façon MobileBottomNav sur mobile : une rangée d'onglets défilante
// suffit pour un espace secondaire, sans surcharger l'écran.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // Même correctif que AppShell (components/layout/app-shell.tsx) : sans
    // le cap md:h-svh/overflow-hidden, la sidebar défilait avec le contenu
    // dès qu'une page (ex. liste des sites) dépassait la hauteur
    // d'écran.
    <div className="flex min-h-svh md:h-svh md:overflow-hidden">
      <aside className="hidden w-60 flex-none flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <div className="mb-6 flex items-center gap-2 text-base font-semibold tracking-tight text-sidebar-foreground">
          <span
            className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-base"
            aria-hidden
          >
            🪂
          </span>
          Administration
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isAdminNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between border-t border-sidebar-border pt-4">
          <ThemeToggle />
          <Button
            nativeButton={false}
            variant="outline"
            size="icon"
            aria-label="Paramètres de sécurité"
            title="Paramètres de sécurité"
            render={
              <Link href="/settings/security">
                <Settings />
              </Link>
            }
          />
          <SignOutButton />
        </div>
        <VersionBadge className="mt-2 text-center" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Administration
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              nativeButton={false}
              variant="outline"
              size="icon"
              aria-label="Paramètres de sécurité"
              title="Paramètres de sécurité"
              render={
                <Link href="/settings/security">
                  <Settings />
                </Link>
              }
            />
            <SignOutButton />
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isAdminNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mx-auto w-full max-w-4xl flex-1 p-4 pb-8 md:overflow-y-auto md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
