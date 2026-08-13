import { prisma } from "@/lib/prisma";
import { siteSearchSchema } from "@/lib/validations/site-search";
import type { Messages } from "@/messages";

const MAX_RESULTS = 20;

// Recherche serveur plutôt que de charger tous les Site côté client (le
// nombre de sites est amené à grandir, docs/decisions/005-flight-takeoff-landing-points.md) :
// filtre par type (TAKEOFF/LANDING) et par nom, spot parent inclus pour que
// l'utilisateur distingue deux sites de même libellé sur des spots
// différents. Requête vide (query === "") : renvoie quand même les premiers
// résultats plutôt qu'une liste vide, pour ne pas laisser le champ de
// recherche vide à l'ouverture.
export async function searchSites(rawInput: unknown, t: Messages["validation"]["siteSearch"]) {
  const input = siteSearchSchema(t).parse(rawInput);

  return prisma.site.findMany({
    where: {
      siteType: { code: input.type },
      label: { contains: input.query, mode: "insensitive" },
    },
    include: { spot: true, siteType: true },
    orderBy: { label: "asc" },
    take: MAX_RESULTS,
  });
}
