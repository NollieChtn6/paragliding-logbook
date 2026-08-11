import { prisma } from "@/lib/prisma";

export async function getSite(siteId: string) {
  return prisma.site.findUnique({
    where: { id: siteId },
    include: { spot: true, siteType: true },
  });
}

export type SiteWithSpot = NonNullable<Awaited<ReturnType<typeof getSite>>>;
