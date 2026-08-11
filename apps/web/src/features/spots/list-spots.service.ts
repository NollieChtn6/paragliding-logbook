import { prisma } from "@/lib/prisma";

// Spot est une donnée de référence partagée (schema.prisma), pas de userId.
// _count.sites plutôt que le détail complet des sites (docs/admin.md >
// Gestion des spots, "nombre de sites associés") : la liste admin n'a pas
// besoin de charger chaque Site pour afficher un simple compteur.
export async function listSpots(query?: string) {
  return prisma.spot.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    include: { _count: { select: { sites: true } } },
    orderBy: { name: "asc" },
  });
}

export type SpotListItem = Awaited<ReturnType<typeof listSpots>>[number];
