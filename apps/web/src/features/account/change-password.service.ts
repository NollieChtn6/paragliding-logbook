import { auth } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations/change-password";

// Pas de userId en paramètre, contrairement aux autres services (create/
// update*(userId, rawInput)) : auth.api.changePassword résout lui-même
// l'utilisateur à partir de la session portée par headers, et réutilise
// telles quelles les fonctions hashPassword/verifyPassword de ce repo
// (branchées dans lib/auth.ts) pour vérifier l'ancien mot de passe et
// hasher le nouveau. revokeOtherSessions: true fait tourner le token de la
// session courante (qui reste active, Better Auth pose le nouveau cookie
// via le plugin nextCookies) et supprime toutes les autres sessions de
// l'utilisateur.
export async function changePassword(headers: Headers, rawInput: unknown): Promise<void> {
  const input = changePasswordSchema.parse(rawInput);

  await auth.api.changePassword({
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      revokeOtherSessions: true,
    },
    headers,
  });
}
