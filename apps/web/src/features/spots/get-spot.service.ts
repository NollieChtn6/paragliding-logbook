import { prisma } from "@/lib/prisma";

// Sites inclus (avec leur type) pour l'écran de détail/modification d'un
// spot (docs/admin.md > Gestion des spots, "consulter ses informations").
export async function getSpot(spotId: string) {
  return prisma.spot.findUnique({
    where: { id: spotId },
    include: { sites: { include: { siteType: true }, orderBy: { label: "asc" } } },
  });
}

export type SpotWithSites = NonNullable<Awaited<ReturnType<typeof getSpot>>>;
