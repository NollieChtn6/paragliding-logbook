"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type SignInActionState = { success: true } | { success: false; error: string };

export async function signInAction(
  _previousState: SignInActionState | null,
  formData: FormData,
): Promise<SignInActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { success: false, error: "Email et mot de passe requis." };
  }

  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch {
    // Message générique volontaire (voir CLAUDE.md > Conventions de sécurité) :
    // ne pas distinguer email inconnu / mot de passe incorrect pour ne pas
    // révéler l'existence d'un compte.
    return { success: false, error: "Email ou mot de passe incorrect." };
  }

  // Hors du try/catch : redirect() lève une erreur interne spéciale que le
  // catch générique ci-dessus ne doit pas intercepter.
  redirect("/activities");
}
