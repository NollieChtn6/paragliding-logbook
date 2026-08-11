"use server";

import { searchAddress } from "@/features/address-search";
import { requireAdmin } from "@/lib/current-user";

// Appelée directement comme fonction async depuis un composant client (pas
// via <form action>), même principe que searchSitesAction
// (actions/search-sites.ts) : une recherche est une lecture, débouncée
// côté client (voir features/schools/address-combobox.tsx). requireAdmin()
// plutôt que requireCurrentUser() : contrairement aux autres recherches de
// référentiel, celle-ci n'est utilisée que dans le formulaire école, réservé
// aux admins (CLAUDE.md > Conventions de sécurité).
export async function searchAddressAction(query: string) {
  await requireAdmin();
  return searchAddress(query);
}
