import { redirect } from "next/navigation";
import type * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/current-user";

// Chrome commun à toutes les pages authentifiées (route group : n'affecte
// pas les URLs, /activities reste /activities). /sign-in reste hors de ce
// groupe, sans AppShell. La vérification de session reste dans chaque page
// (requireCurrentUser()) : ce layout est uniquement présentation, pas une
// frontière de sécurité — sauf pour la redirection ADMIN ci-dessous, qui
// n'est pas un contrôle de sécurité (requireAdmin() reste la seule autorité
// côté /admin) mais une redirection de confort : un admin n'a pas d'usage de
// l'interface des autres utilisateurs, tout son parcours vit sous /admin.
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  return <AppShell>{children}</AppShell>;
}
