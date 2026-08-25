import type { LucideIcon } from "lucide-react";
import { Award, Home, ListChecks, PlusCircle, TrendingUp } from "lucide-react";
import type { Messages } from "@/messages";

export type NavItem = {
  href: string;
  labelKey: keyof Pick<
    Messages["shell"],
    "navHome" | "navActivities" | "navProgression" | "navQualifications" | "navAdd"
  >;
  icon: LucideIcon;
};

// Source commune à DesktopSidebar et MobileBottomNav : les entrées de
// navigation principale. labelKey plutôt qu'un libellé en dur : résolu via
// t.shell[...] par chaque composant consommateur (useT()). Progression et
// Brevets entre Activités et Ajouter : deux destinations de consultation
// comme Activités, "Ajouter" reste la dernière action de la barre. Brevets
// promu ici (pas seulement menu de compte / raccourci Progression) suite au
// retour utilisatrice : une donnée importante doit être directement
// accessible, pas seulement via des chemins secondaires.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "navHome", icon: Home },
  { href: "/activities", labelKey: "navActivities", icon: ListChecks },
  { href: "/progression", labelKey: "navProgression", icon: TrendingUp },
  { href: "/qualifications", labelKey: "navQualifications", icon: Award },
  { href: "/activities/new", labelKey: "navAdd", icon: PlusCircle },
];

// /activities/new est une entrée à part entière : ne doit pas aussi
// allumer "Activités". /activities/[id] et /activities/[id]/edit restent
// sous "Activités". Même principe pour /qualifications/new et
// /qualifications/[id]/edit sous "Brevets" — pas d'équivalent "Ajouter"
// séparé pour les brevets, contrairement aux activités.
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
  if (href === "/qualifications") {
    return pathname === "/qualifications" || pathname.startsWith("/qualifications/");
  }
  return pathname === href;
}
