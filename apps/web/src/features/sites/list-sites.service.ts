import { prisma } from "@/lib/prisma";

// Site est une donnée de référence partagée (schema.prisma), pas de userId.
// _count.points plutôt que le détail complet des points (docs/admin.md >
// Gestion des sites, "nombre de points associés") : la liste admin n'a pas
// besoin de charger chaque SitePoint pour afficher un simple compteur.
export async function listSites(query?: string) {
  return prisma.site.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    include: { _count: { select: { points: true } } },
    orderBy: { name: "asc" },
  });
}

export type SiteListItem = Awaited<ReturnType<typeof listSites>>[number];
