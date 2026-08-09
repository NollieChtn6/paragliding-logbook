import type * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/current-user";

// Chrome commun à toutes les pages authentifiées (route group : n'affecte
// pas les URLs, /activities reste /activities). /sign-in reste hors de ce
// groupe, sans AppShell. La vérification de session reste dans chaque page
// (requireCurrentUser()) : ce layout est uniquement présentation, pas une
// frontière de sécurité. getCurrentUser() (pas requireCurrentUser()) : ne
// doit jamais rediriger depuis le layout, seulement savoir si le lien
// Administration doit apparaître (docs/admin.md > Navigation — le masquer
// n'est qu'une amélioration UX, requireAdmin() reste la seule autorité
// côté /admin).
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return <AppShell isAdmin={user?.role === "ADMIN"}>{children}</AppShell>;
}
