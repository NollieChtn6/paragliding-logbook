"use server";

import { searchCity } from "@/features/address-search";

// Appelée directement comme fonction async depuis un composant client (pas
// via <form action>), même principe que searchSitesAction
// (actions/search-sites.ts) : une recherche est une lecture, débouncée
// côté client (voir features/account/city-combobox.tsx).
//
// Pas de requireCurrentUser() ici, contrairement à searchSitesAction : ce
// combobox est utilisé aussi bien sur /settings/security (authentifié) que
// sur /sign-up (visiteur pas encore inscrit, voir
// verifySignUpInviteCodeAction pour le même raisonnement) — exiger une
// session casserait la recherche à l'inscription. Sans risque : simple
// relai vers une API publique (BAN, gouv.fr), aucune donnée interne
// exposée.
export async function searchCityAction(query: string) {
  return searchCity(query);
}
