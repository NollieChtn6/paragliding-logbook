import { prisma } from "@/lib/prisma";

export type ListSitePointsFilters = {
  query?: string;
  siteId?: string;
  typeCode?: "TAKEOFF" | "LANDING";
};

// Liste admin (/admin/site-points), à distinguer de search-site-points.service.ts
// (recherche débouncée du formulaire de vol) : filtres combinables
// (recherche par nom, site, type — docs/admin.md > Gestion des points de site).
export async function listSitePoints(filters: ListSitePointsFilters = {}) {
  return prisma.sitePoint.findMany({
    where: {
      label: filters.query ? { contains: filters.query, mode: "insensitive" } : undefined,
      siteId: filters.siteId,
      sitePointType: filters.typeCode ? { code: filters.typeCode } : undefined,
    },
    include: { site: true, sitePointType: true },
    orderBy: [{ site: { name: "asc" } }, { label: "asc" }],
  });
}

export type SitePointListItem = Awaited<ReturnType<typeof listSitePoints>>[number];
