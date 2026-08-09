import type * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/current-user";

// Frontière de sécurité pour tout /admin/* : requireAdmin() fait autorité
// (docs/admin.md > Protection de /admin) — proxy.ts ne fait qu'une
// vérification optimiste de la présence du cookie de session (voir son
// commentaire), il ne peut pas lire le rôle sans requête DB. Chaque Server
// Action admin revérifie aussi par elle-même (voir actions/create-site.ts) :
// ce layout protège les pages, pas les mutations.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
