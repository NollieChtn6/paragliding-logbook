import { z } from "zod";

const BAN_SEARCH_URL = "https://api-adresse.data.gouv.fr/search/";
const MAX_RESULTS = 5;
const MIN_QUERY_LENGTH = 3;
const REQUEST_TIMEOUT_MS = 5000;

export type AddressSuggestion = {
  id: string;
  label: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
};

const banFeatureSchema = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    id: z.string(),
    label: z.string(),
    postcode: z.string().optional(),
    city: z.string().optional(),
  }),
});

const banResponseSchema = z.object({ features: z.array(banFeatureSchema) });

// Recherche via l'API Adresse (Base Adresse Nationale, gouv.fr) plutôt qu'un
// référentiel interne : couvre l'ensemble des adresses françaises sans
// qu'il y ait quoi que ce soit à saisir/maintenir côté application (voir
// features/schools/address-combobox.tsx). Échoue silencieusement (liste
// vide) sur toute erreur réseau/format inattendu plutôt que de faire
// remonter une exception : une suggestion d'adresse est un confort pour
// l'admin, pas une donnée requise pour utiliser le formulaire.
export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const url = new URL(BAN_SEARCH_URL);
  url.searchParams.set("q", trimmed);
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

  return parsed.data.features.map((feature) => ({
    id: feature.properties.id,
    label: feature.properties.label,
    postalCode: feature.properties.postcode ?? "",
    city: feature.properties.city ?? "",
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
  }));
}
