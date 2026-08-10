// Restreint /sign-up à une liste blanche d'emails, sans toucher au reste du
// flux d'inscription (audit sécurité, item S2 : l'usage réel de THERMIK est
// un petit cercle de confiance, pas un service public, alors que /sign-up
// est techniquement ouvert à quiconque trouve l'URL — repo public). Même
// principe que ADMIN_PASSWORD dans prisma/seed.ts : hors de cette variable
// d'env, la restriction est simplement absente (pas de valeur par défaut
// codée en dur), pour ne rien changer au comportement existant tant qu'elle
// n'est pas explicitement configurée.
function allowedEmails(): Set<string> | null {
  const raw = process.env.SIGNUP_ALLOWED_EMAILS;
  if (!raw?.trim()) {
    return null;
  }
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

// email doit déjà être normalisé (trim + minuscules) par signUpSchema
// (lib/validations/sign-up.ts) avant d'arriver ici.
export function isSignUpAllowed(email: string): boolean {
  const allowList = allowedEmails();
  if (!allowList) {
    return true;
  }
  return allowList.has(email);
}

// Levée par sign-up.service.ts, mappée vers un message dédié par
// signUpAction (actions/sign-up.ts) — même principe que
// ReferenceDataInUseError (lib/reference-data-in-use.error.ts).
export class SignUpNotAllowedError extends Error {
  constructor() {
    super("Cette adresse email n'est pas autorisée à créer un compte.");
    this.name = "SignUpNotAllowedError";
  }
}
