import { DEV_USER_EMAIL } from "@/lib/dev-fixtures";
import { prisma } from "@/lib/prisma";

// Pas d'Auth.js pour l'instant : "l'utilisateur courant" est l'utilisateur de
// développement créé par le seed. Point d'extension unique à remplacer par
// une vraie résolution de session le jour venu.
export function getCurrentUser() {
  return prisma.user.findUnique({ where: { email: DEV_USER_EMAIL } });
}
