import { auth } from "@/lib/auth";
import { isSignUpAllowed, SignUpNotAllowedError } from "@/lib/signup-allowlist";
import { signUpSchema } from "@/lib/validations/sign-up";

// auth.api.signUpEmail reste l'unique responsable de la création du compte
// (User + Account "credential", hash Argon2 via lib/password.ts branché dans
// lib/auth.ts) : cette fonction ne fait que valider la forme avant de lui
// déléguer, même principe que change-password.service.ts. Appelée depuis une
// Server Action (actions/sign-up.ts), le plugin nextCookies (lib/auth.ts)
// pose automatiquement le cookie de session renvoyé par Better Auth — pas de
// connexion manuelle supplémentaire à faire ici pour la connexion automatique.
export async function signUp(rawInput: unknown): Promise<void> {
  const input = signUpSchema.parse(rawInput);

  // Liste blanche (lib/signup-allowlist.ts) vérifiée avant Better Auth : pas
  // besoin de solliciter la création du compte pour rejeter une inscription
  // hors périmètre.
  if (!isSignUpAllowed(input.email)) {
    throw new SignUpNotAllowedError();
  }

  await auth.api.signUpEmail({
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
    },
  });
}
