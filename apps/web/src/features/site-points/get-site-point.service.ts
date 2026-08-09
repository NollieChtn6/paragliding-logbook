import { prisma } from "@/lib/prisma";

export async function getSitePoint(sitePointId: string) {
  return prisma.sitePoint.findUnique({
    where: { id: sitePointId },
    include: { site: true, sitePointType: true },
  });
}

export type SitePointWithSite = NonNullable<Awaited<ReturnType<typeof getSitePoint>>>;
