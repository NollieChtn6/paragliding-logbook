"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, isAdminNavItemActive } from "./admin-nav-items";

// Chrome dédié à /admin (docs/admin.md > Interface, Navigation) : mêmes
// tokens/composants que AppShell (components/layout/app-shell.tsx) — pas de
// seconde identité visuelle — mais navigation propre à l'espace admin (les
// entrées de l'app principale n'ont pas leur place ici). "Retour à
// l'application" toujours visible, desktop et mobile (exigence explicite du
// document de specs). Pas de barre de navigation basse façon
// MobileBottomNav sur mobile : une rangée d'onglets défilante suffit pour
// un espace secondaire, sans surcharger l'écran.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh">
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
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Administration
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 px-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Retour
            </Link>
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

        <main className="mx-auto w-full max-w-4xl flex-1 p-4 pb-8 md:p-6">{children}</main>
      </div>
    </div>
  );
}
