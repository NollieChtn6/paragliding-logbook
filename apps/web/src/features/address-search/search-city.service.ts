import { z } from "zod";

const BAN_SEARCH_URL = "https://api-adresse.data.gouv.fr/search/";
const MAX_RESULTS = 5;
const MIN_QUERY_LENGTH = 3;
const REQUEST_TIMEOUT_MS = 5000;

export type CitySuggestion = {
  id: string;
  city: string;
  postalCode: string;
};

const banMunicipalitySchema = z.object({
  properties: z.object({
    id: z.string(),
    city: z.string().optional(),
    postcode: z.string().optional(),
  }),
});

const banResponseSchema = z.object({ features: z.array(banMunicipalitySchema) });

// Même API que search-address.service.ts (BAN, gouv.fr), mais avec
// type=municipality : restreint les résultats aux communes plutôt qu'aux
// adresses complètes (rue + numéro) — pas adapté à "chercher une ville".
// Pas de coordonnées ni de libellé de rue dans le résultat, inutiles ici
// (voir features/account/city-combobox.tsx). Même échec silencieux (liste
// vide) qu'searchAddress : une suggestion de ville est un confort, pas une
// donnée requise pour utiliser le formulaire.
export async function searchCity(query: string): Promise<CitySuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const url = new URL(BAN_SEARCH_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("type", "municipality");
  url.searchParams.set("limit", String(MAX_RESULTS));

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const parsed = banResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return [];
  }

  return parsed.data.features
    .filter((feature) => feature.properties.city)
    .map((feature) => ({
      id: feature.properties.id,
      city: feature.properties.city as string,
      postalCode: feature.properties.postcode ?? "",
    }));
}
