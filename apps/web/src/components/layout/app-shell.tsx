import { Settings } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";

type AppShellProps = {
  children: React.ReactNode;
};

// Chrome commun des pages authentifiées (racine du route group (app), voir
// app/(app)/layout.tsx). Jamais rendu pour un rôle ADMIN : le layout
// redirige vers /admin avant d'atteindre ce composant (docs/admin.md >
// Navigation — un admin n'a pas d'usage de l'interface des autres
// utilisateurs), donc pas de lien Administration ici. DesktopSidebar porte
// marque + thème + déconnexion à partir de md ; en dessous, une bande haute
// minimale assure la même fonction puisque DesktopSidebar est masquée en
// mobile.
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-svh">
      <DesktopSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          >
            <span aria-hidden>🪂</span>
            THERMIK
          </Link>
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

        <main className="mx-auto w-full max-w-3xl flex-1 p-4 pb-24 md:p-6">{children}</main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
