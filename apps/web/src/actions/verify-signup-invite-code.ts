"use server";

import { isSignUpInviteCodeValid } from "@/lib/signup-invite-code";

// Appelée directement comme fonction async depuis SignUpForm (composant
// client), même principe que searchSitePointsAction (actions/search-site-points.ts) :
// juste une lecture, pas de useActionState/FormData. Sert uniquement de
// feedback immédiat sur l'étape "code" de l'UI — la frontière de sécurité
// réelle reste la revérification dans signUp (features/auth/sign-up.service.ts),
// jamais contournable depuis le client. Pas de requireCurrentUser() ici : un
// visiteur non authentifié doit justement pouvoir prouver qu'il détient le
// code avant de pouvoir créer un compte.
export async function verifySignUpInviteCodeAction(code: string): Promise<boolean> {
  return isSignUpInviteCodeValid(code);
}
