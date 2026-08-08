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
