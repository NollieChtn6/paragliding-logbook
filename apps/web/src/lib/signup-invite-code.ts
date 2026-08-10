// Restreint /sign-up par un code unique partageable, en attendant un
// renforcement plus complet de la sécurité de l'inscription (audit
// sécurité, item S2 — remplace la première version à liste blanche
// d'emails : plus simple à partager avec de futurs membres, sans avoir à
// connaître leur adresse à l'avance). Même principe que ADMIN_PASSWORD
// (prisma/seed.ts) : hors de cette variable d'env, la restriction est
// simplement absente, pour ne rien changer au comportement existant tant
// qu'elle n'est pas explicitement configurée.
//
// 6 chiffres : longueur standard d'un code OTP (compromis lisibilité/saisie
// mobile vs résistance au brute force), garder SIGNUP_INVITE_CODE_LENGTH en
// phase avec l'UI dédiée (voir sign-up/sign-up-form.tsx).
export const SIGNUP_INVITE_CODE_LENGTH = 6;

function configuredCode(): string | null {
  const raw = process.env.SIGNUP_INVITE_CODE;
  return raw?.trim() ? raw.trim() : null;
}

export function isSignUpInviteCodeRequired(): boolean {
  return configuredCode() !== null;
}

export function isSignUpInviteCodeValid(code: string): boolean {
  const expected = configuredCode();
  if (!expected) {
    return true;
  }
  return code === expected;
}

// Levée par sign-up.service.ts, mappée vers un message dédié par
// signUpAction (actions/sign-up.ts) — même principe que
// ReferenceDataInUseError (lib/reference-data-in-use.error.ts).
export class SignUpNotAllowedError extends Error {
  constructor() {
    super("Le code d'inscription est invalide.");
    this.name = "SignUpNotAllowedError";
  }
}
