import { prisma } from "@/lib/prisma";
import { spotSearchSchema } from "@/lib/validations/spot-search";

const MAX_RESULTS = 20;

// Recherche serveur plutôt que la liste complète chargée d'avance (même
// principe que search-sites.service.ts, audit UX item F4) : le formulaire
// de séance de gonflage utilisait jusqu'ici un <Select> avec tous les
// spots, incohérent avec le combobox déjà utilisé pour les sites de
// décollage/atterrissage en formulaire de vol, et amené à devenir peu
// maniable à mesure que le référentiel grandit. Distincte de listSpots
// (features/spots/, utilisée par /admin/spots) : pas de _count.sites, pas
// de pagination admin, juste un top MAX_RESULTS pour un champ de recherche.
export async function searchSpots(rawInput: unknown) {
  const input = spotSearchSchema.parse(rawInput);

  return prisma.spot.findMany({
    where: { name: { contains: input.query, mode: "insensitive" } },
    select: { id: true, name: true, region: true },
    orderBy: { name: "asc" },
    take: MAX_RESULTS,
  });
}
