"use server";

import { APIError } from "better-auth/api";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { signUp } from "@/features/auth";
import { getLocale } from "@/lib/i18n/get-locale";
import { toSafeRedirectPath } from "@/lib/safe-redirect";
import { SignUpNotAllowedError } from "@/lib/signup-invite-code";
import { withToast } from "@/lib/toast-redirect";
import { getDictionary } from "@/messages";

export type SignUpActionState =
  | { success: true }
  | { success: false; error: string; emailAlreadyUsed?: boolean };

// Même structure que signInAction (actions/sign-in.ts) : redirect() en cas de
// succès, redirectTo revalidé contre les open redirects. La connexion
// automatique après inscription ne demande aucun code supplémentaire :
// auth.api.signUpEmail crée la session et le plugin nextCookies (lib/auth.ts)
// pose le cookie, exactement comme pour signInEmail.
export async function signUpAction(
  _previousState: SignUpActionState | null,
  formData: FormData,
): Promise<SignUpActionState> {
  const redirectTo = toSafeRedirectPath(formData.get("redirectTo")?.toString(), "/activities");
  const t = getDictionary(await getLocale());

  try {
    await signUp(Object.fromEntries(formData), t.validation.signUp);
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.issues[0]?.message ?? t.common.invalidForm };
    }
    if (error instanceof SignUpNotAllowedError) {
      return { success: false, error: t.auth.signUp.notAllowed };
    }
    if (error instanceof APIError) {
      // Code posé par auth.api.signUpEmail quand l'email existe déjà (voir
      // BASE_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL côté Better
      // Auth) : message dédié, le lien vers /sign-in est affiché par SignUpForm.
      if (error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        return {
          success: false,
          error: t.auth.signUp.emailAlreadyUsed,
          emailAlreadyUsed: true,
        };
      }
      return { success: false, error: t.auth.signUp.accountCreationFailed };
    }
    return { success: false, error: t.auth.signUp.accountCreationError };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter (voir signInAction).
  redirect(withToast(redirectTo, t.toast.signUpSuccess));
}
