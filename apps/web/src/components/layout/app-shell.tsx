import { Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";

type AppShellProps = {
  children: React.ReactNode;
  // Lien Administration affiché uniquement pour un rôle ADMIN (docs/admin.md
  // > Navigation) : masquer le lien n'est qu'une amélioration UX, la
  // véritable protection reste requireAdmin() côté serveur (app/admin/layout.tsx).
  isAdmin?: boolean;
};

// Chrome commun des pages authentifiées (racine du route group (app), voir
// app/(app)/layout.tsx). DesktopSidebar porte marque + thème + déconnexion
// à partir de md ; en dessous, une bande haute minimale assure la même
// fonction puisque DesktopSidebar est masquée en mobile.
export function AppShell({ children, isAdmin = false }: AppShellProps) {
  return (
    <div className="flex min-h-svh">
      <DesktopSidebar isAdmin={isAdmin} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <span aria-hidden>🪂</span>
            THERMIK
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {isAdmin && (
              <Button
                nativeButton={false}
                variant="outline"
                size="icon"
                aria-label="Administration"
                title="Administration"
                render={
                  <Link href="/admin">
                    <ShieldCheck />
                  </Link>
                }
              />
            )}
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
