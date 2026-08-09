"use server";

import { searchSitePoints } from "@/features/site-points";

// Appelée directement comme fonction async depuis un composant client (pas
// via <form action>) : une recherche est une lecture, pas une mutation —
// pas de useActionState/FormData ici, juste un appel imperatif à chaque
// frappe (débouncé côté client, voir features/flights/site-point-combobox.tsx).
export async function searchSitePointsAction(query: string, type: "TAKEOFF" | "LANDING") {
  return searchSitePoints({ query, type });
}
