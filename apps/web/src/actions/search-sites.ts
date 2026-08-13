"use server";

import { searchSites } from "@/features/sites";
import { requireCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/messages";

// Appelée directement comme fonction async depuis un composant client (pas
// via <form action>) : une recherche est une lecture, pas une mutation —
// pas de useActionState/FormData ici, juste un appel imperatif à chaque
// frappe (débouncé côté client, voir features/flights/site-combobox.tsx).
//
// requireCurrentUser() par cohérence avec le reste des Server Actions (voir
// CLAUDE.md > Conventions de sécurité) même si la donnée renvoyée est un
// référentiel partagé non sensible (ADR 004) : une Server Action exposée
// sans vérification de session est une porte ouverte pour toute future
// évolution qui copierait ce fichier comme modèle.
export async function searchSitesAction(query: string, type: "TAKEOFF" | "LANDING") {
  await requireCurrentUser();
  const t = getDictionary(await getLocale());
  return searchSites({ query, type }, t.validation.siteSearch);
}
