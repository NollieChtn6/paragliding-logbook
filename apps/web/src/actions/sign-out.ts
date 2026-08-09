"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });

  // Hors du try/catch (il n'y en a pas ici) : redirect() lève une erreur
  // interne spéciale, propagée normalement — pas de gestion d'erreur pour
  // cette action volontairement simple.
  redirect("/");
}
