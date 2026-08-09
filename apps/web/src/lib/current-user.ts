import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Résolution de l'utilisateur courant à partir de la vraie session Better
// Auth (voir lib/auth.ts) — plus de fallback sur un utilisateur de
// développement fixe.
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

// À utiliser dans les pages/Server Actions qui exigent une session. proxy.ts
// ne fait qu'une vérification optimiste (présence du cookie, voir
// src/proxy.ts) : c'est ici que la vérification fait autorité, pour le cas
// où le cookie est présent mais la session invalide/expirée en base.
export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

// Abstraction dédiée pour l'espace /admin (docs/admin.md > Helpers
// d'autorisation) : point d'entrée unique pour vérifier le rôle, plutôt que
// de disperser des `if (user.role === "ADMIN")` dans chaque page/Server
// Action. proxy.ts ne vérifie que la présence du cookie (voir son
// commentaire) — il ne peut pas lire le rôle sans requête DB, donc la
// vérification qui fait autorité reste ici. Un utilisateur non admin est
// silencieusement ramené à l'accueil : /admin n'a pas besoin d'une page
// "accès refusé" dédiée pour ce périmètre initial.
export async function requireAdmin() {
  const user = await requireCurrentUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
