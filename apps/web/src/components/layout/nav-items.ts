import type { LucideIcon } from "lucide-react";
import { Home, ListChecks, PlusCircle } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Source commune à DesktopSidebar et MobileBottomNav : les 3 entrées de
// navigation principale (aucune nouvelle route, uniquement des liens vers
// des pages déjà existantes).
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/activities", label: "Activités", icon: ListChecks },
  { href: "/activities/new", label: "Ajouter", icon: PlusCircle },
];

// /activities/new est une entrée à part entière : ne doit pas aussi
// allumer "Activités". /activities/[id] et /activities/[id]/edit restent
// sous "Activités".
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (href === "/activities") {
    return (
      pathname === "/activities" ||
      (pathname.startsWith("/activities/") && pathname !== "/activities/new")
    );
  }
  return pathname === href;
}
