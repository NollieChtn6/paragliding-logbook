import { auth } from "@/lib/auth";
import { isSignUpInviteCodeValid, SignUpNotAllowedError } from "@/lib/signup-invite-code";
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

  // Code d'inscription (lib/signup-invite-code.ts) revérifié ici pour de bon
  // — c'est la frontière de sécurité réelle, l'étape dédiée de
  // sign-up-form.tsx n'est qu'un confort d'UI (feedback immédiat) et ne
  // protège rien à elle seule.
  if (!isSignUpInviteCodeValid(input.inviteCode)) {
    throw new SignUpNotAllowedError();
  }

  await auth.api.signUpEmail({
    body: {
      name: input.name,
      city: input.city,
      email: input.email,
      password: input.password,
    },
  });
}
