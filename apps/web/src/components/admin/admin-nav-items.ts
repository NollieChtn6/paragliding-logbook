import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Map as MapIcon, MapPin, School, Waypoints } from "lucide-react";
import type { Messages } from "@/messages";

export type AdminNavItem = {
  href: string;
  labelKey: keyof Pick<
    Messages["admin"],
    "navDashboard" | "navSpots" | "navSites" | "navSchools" | "navMap"
  >;
  icon: LucideIcon;
};

// Navigation propre à /admin (docs/admin.md > Navigation) : distincte des
// NAV_ITEMS de l'app principale (components/layout/nav-items.ts). labelKey
// résolu via t.admin[...] par AdminShell (useT()).
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", labelKey: "navDashboard", icon: LayoutDashboard },
  { href: "/admin/spots", labelKey: "navSpots", icon: MapPin },
  { href: "/admin/sites", labelKey: "navSites", icon: Waypoints },
  { href: "/admin/schools", labelKey: "navSchools", icon: School },
  { href: "/admin/map", labelKey: "navMap", icon: MapIcon },
];

export function isAdminNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
