"use server";

import { searchSpots } from "@/features/spots";
import { requireCurrentUser } from "@/lib/current-user";

// Appelée directement comme fonction async depuis un composant client (pas
// via <form action>), même principe que searchSitesAction
// (actions/search-sites.ts) : une recherche est une lecture, débouncée côté
// client, requireCurrentUser() par cohérence avec le reste des Server
// Actions même si Spot est un référentiel partagé non sensible (ADR 004).
export async function searchSpotsAction(query: string) {
  await requireCurrentUser();
  return searchSpots({ query });
}
