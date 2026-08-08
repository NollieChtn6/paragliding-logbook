import type * as React from "react";
import { AppShell } from "@/components/layout/app-shell";

// Chrome commun à toutes les pages authentifiées (route group : n'affecte
// pas les URLs, /activities reste /activities). /sign-in reste hors de ce
// groupe, sans AppShell. La vérification de session reste dans chaque page
// (requireCurrentUser()) : ce layout est uniquement présentation, pas une
// frontière de sécurité.
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
