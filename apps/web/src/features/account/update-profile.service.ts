import { auth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations/update-profile";
import type { Messages } from "@/messages";

// Même principe que changePassword (change-password.service.ts) :
// auth.api.updateUser résout lui-même l'utilisateur à partir de la session
// portée par headers, et rafraîchit le cookie de session avec le nouveau
// nom (voir Better Auth, update-user.ts > setSessionCookie) — pas besoin de
// relire l'utilisateur après coup pour que le reste de l'app voie le
// changement. email volontairement non modifiable ici (Better Auth rejette
// même `email` dans le body de /update-user) : changer d'email impliquerait
// de revalider son adresse, ce que le projet ne fait pas encore (voir
// docs/todo.md > vérification d'adresse email, backlog).
export async function updateProfile(
  headers: Headers,
  rawInput: unknown,
  t: Messages["validation"]["updateProfile"],
): Promise<void> {
  const input = updateProfileSchema(t).parse(rawInput);

  await auth.api.updateUser({
    body: { name: input.name, city: input.city ?? null },
    headers,
  });
}
