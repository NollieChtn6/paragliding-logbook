import { prisma } from "@/lib/prisma";

export type ListSitesFilters = {
  query?: string;
  spotId?: string;
  typeCode?: "TAKEOFF" | "LANDING";
};

// Liste admin (/admin/sites), à distinguer de search-sites.service.ts
// (recherche débouncée du formulaire de vol) : filtres combinables
// (recherche par nom, spot, type — docs/admin.md > Gestion des sites).
export async function listSites(filters: ListSitesFilters = {}) {
  return prisma.site.findMany({
    where: {
      label: filters.query ? { contains: filters.query, mode: "insensitive" } : undefined,
      spotId: filters.spotId,
      siteType: filters.typeCode ? { code: filters.typeCode } : undefined,
    },
    include: { spot: true, siteType: true },
    orderBy: [{ spot: { name: "asc" } }, { label: "asc" }],
  });
}

export type SiteListItem = Awaited<ReturnType<typeof listSites>>[number];
