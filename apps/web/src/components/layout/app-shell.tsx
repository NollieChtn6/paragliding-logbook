import { MapPin, Settings } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { AmbientArc } from "@/components/ambient-arc";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";

type AppShellProps = {
  children: React.ReactNode;
  city?: string | null;
};

// Chrome commun des pages authentifiées (racine du route group (app), voir
// app/(app)/layout.tsx). Jamais rendu pour un rôle ADMIN : le layout
// redirige vers /admin avant d'atteindre ce composant (docs/admin.md >
// Navigation — un admin n'a pas d'usage de l'interface des autres
// utilisateurs), donc pas de lien Administration ici. DesktopSidebar porte
// marque + thème + déconnexion à partir de md ; en dessous, une bande haute
// minimale assure la même fonction puisque DesktopSidebar est masquée en
// mobile.
export function AppShell({ children, city }: AppShellProps) {
  return (
    // h-svh + overflow-hidden, sans condition de largeur : la coquille
    // (sidebar comprise sur desktop) reste toujours calée sur la hauteur de
    // l'écran, seul <main> défile (overflow-y-auto ci-dessous) — sans ça, la
    // page entière défilait dès qu'un écran (ex. liste d'activités)
    // dépassait la hauteur de la fenêtre, et header/MobileBottomNav (fixed,
    // donc déjà hors du flux) laissaient <main> défiler sous eux plutôt que
    // de le contenir proprement entre les deux.
    <div className="flex h-svh overflow-hidden">
      <AmbientArc />
      <DesktopSidebar city={city} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <div className="flex flex-col gap-0.5">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
            >
              <span aria-hidden>🪂</span>
              THERMIK
            </Link>
            {/* pl-6 aligne approximativement sous le texte (emoji + gap-2) :
            même logique que DesktopSidebar, décision de cohérence
            inter-plateforme plutôt que de réserver l'info au desktop. */}
            {city && (
              <span className="flex items-center gap-1 pl-6 text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden />
                {city}
              </span>
            )}
          </div>
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

        <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-4 pb-24 md:p-6">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
