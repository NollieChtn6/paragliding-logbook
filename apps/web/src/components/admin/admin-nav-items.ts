import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Map as MapIcon, MapPin, School, Waypoints } from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Navigation propre à /admin (docs/admin.md > Navigation) : distincte des
// NAV_ITEMS de l'app principale (components/layout/nav-items.ts).
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/spots", label: "Spots", icon: MapPin },
  { href: "/admin/sites", label: "Sites", icon: Waypoints },
  { href: "/admin/schools", label: "Écoles", icon: School },
  { href: "/admin/map", label: "Carte", icon: MapIcon },
];

export function isAdminNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
