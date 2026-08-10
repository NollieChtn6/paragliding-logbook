"use server";

import { searchSites } from "@/features/sites";
import { requireCurrentUser } from "@/lib/current-user";

// Appelée directement comme fonction async depuis un composant client (pas
// via <form action>), même principe que searchSitePointsAction
// (actions/search-site-points.ts) : une recherche est une lecture, débouncée
// côté client, requireCurrentUser() par cohérence avec le reste des Server
// Actions même si Site est un référentiel partagé non sensible (ADR 004).
export async function searchSitesAction(query: string) {
  await requireCurrentUser();
  return searchSites({ query });
}
