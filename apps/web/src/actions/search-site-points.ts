"use server";

import { searchSitePoints } from "@/features/site-points";
import { requireCurrentUser } from "@/lib/current-user";

// Appelée directement comme fonction async depuis un composant client (pas
// via <form action>) : une recherche est une lecture, pas une mutation —
// pas de useActionState/FormData ici, juste un appel imperatif à chaque
// frappe (débouncé côté client, voir features/flights/site-point-combobox.tsx).
//
// requireCurrentUser() par cohérence avec le reste des Server Actions (voir
// CLAUDE.md > Conventions de sécurité) même si la donnée renvoyée est un
// référentiel partagé non sensible (ADR 004) : une Server Action exposée
// sans vérification de session est une porte ouverte pour toute future
// évolution qui copierait ce fichier comme modèle.
export async function searchSitePointsAction(query: string, type: "TAKEOFF" | "LANDING") {
  await requireCurrentUser();
  return searchSitePoints({ query, type });
}
