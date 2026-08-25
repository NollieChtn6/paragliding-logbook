import type { LucideIcon } from "lucide-react";
import { Home, ListChecks, PlusCircle, TrendingUp } from "lucide-react";
import type { Messages } from "@/messages";

export type NavItem = {
  href: string;
  labelKey: keyof Pick<
    Messages["shell"],
    "navHome" | "navActivities" | "navProgression" | "navAdd"
  >;
  icon: LucideIcon;
};

// Source commune à DesktopSidebar et MobileBottomNav : les entrées de
// navigation principale. labelKey plutôt qu'un libellé en dur : résolu via
// t.shell[...] par chaque composant consommateur (useT()). Progression
// entre Activités et Ajouter : une destination de consultation comme
// Activités, "Ajouter" reste la dernière action de la barre.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "navHome", icon: Home },
  { href: "/activities", labelKey: "navActivities", icon: ListChecks },
  { href: "/progression", labelKey: "navProgression", icon: TrendingUp },
  { href: "/activities/new", labelKey: "navAdd", icon: PlusCircle },
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
