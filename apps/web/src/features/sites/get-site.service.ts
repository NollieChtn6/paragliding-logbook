import { prisma } from "@/lib/prisma";

// Points inclus (avec leur type) pour l'écran de détail/modification d'un
// site (docs/admin.md > Gestion des sites, "consulter ses informations").
export async function getSite(siteId: string) {
  return prisma.site.findUnique({
    where: { id: siteId },
    include: { points: { include: { sitePointType: true }, orderBy: { label: "asc" } } },
  });
}

export type SiteWithPoints = NonNullable<Awaited<ReturnType<typeof getSite>>>;
