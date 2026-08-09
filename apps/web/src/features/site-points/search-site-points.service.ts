import { prisma } from "@/lib/prisma";
import { sitePointSearchSchema } from "@/lib/validations/site-point-search";

const MAX_RESULTS = 20;

// Recherche serveur plutôt que de charger tous les SitePoint côté client
// (le nombre de points est amené à grandir, docs/decisions/005-flight-takeoff-landing-points.md) :
// filtre par type (TAKEOFF/LANDING) et par nom, site parent inclus pour que
// l'utilisateur distingue deux points de même libellé sur des sites
// différents. Requête vide (query === "") : renvoie quand même les premiers
// résultats plutôt qu'une liste vide, pour ne pas laisser le champ de
// recherche vide à l'ouverture.
export async function searchSitePoints(rawInput: unknown) {
  const input = sitePointSearchSchema.parse(rawInput);

  return prisma.sitePoint.findMany({
    where: {
      sitePointType: { code: input.type },
      label: { contains: input.query, mode: "insensitive" },
    },
    include: { site: true, sitePointType: true },
    orderBy: { label: "asc" },
    take: MAX_RESULTS,
  });
}
