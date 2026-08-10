import { prisma } from "@/lib/prisma";
import { siteSearchSchema } from "@/lib/validations/site-search";

const MAX_RESULTS = 20;

// Recherche serveur plutôt que la liste complète chargée d'avance (même
// principe que search-site-points.service.ts, audit UX item F4) : le
// formulaire de séance de gonflage utilisait jusqu'ici un <Select> avec
// tous les sites, incohérent avec le combobox déjà utilisé pour les points
// de site en formulaire de vol, et amené à devenir peu maniable à mesure
// que le référentiel grandit. Distincte de listSites (features/sites/,
// utilisée par /admin/sites) : pas de _count.points, pas de pagination
// admin, juste un top MAX_RESULTS pour un champ de recherche.
export async function searchSites(rawInput: unknown) {
  const input = siteSearchSchema.parse(rawInput);

  return prisma.site.findMany({
    where: { name: { contains: input.query, mode: "insensitive" } },
    select: { id: true, name: true, region: true },
    orderBy: { name: "asc" },
    take: MAX_RESULTS,
  });
}
