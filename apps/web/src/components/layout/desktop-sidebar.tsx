"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";

// Colonne fixe visible à partir de md, masquée en dessous (MobileBottomNav
// prend le relais). Porte la marque, la navigation, et le thème/déconnexion
// en pied — MobileBottomNav n'a que la navigation, ces deux actions vivent
// dans la bande haute mobile d'AppShell.
export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-none flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 text-base font-semibold tracking-tight text-sidebar-foreground"
      >
        <span
          className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-base"
          aria-hidden
        >
          🪂
        </span>
        THERMIK
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
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
    </aside>
  );
}
