import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";

// Relations directes de Site (schema.prisma) : points et
// groundHandlingSessions. Bloquer la suppression si l'une des deux est non
// vide protège transitivement les Flight (référencés via SitePoint, jamais
// directement via Site) sans que ce service ait besoin de connaître Flight
// — docs/admin.md > Suppression : jamais de cascade silencieuse.
export async function deleteSite(siteId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [pointCount, sessionCount] = await Promise.all([
      tx.sitePoint.count({ where: { siteId } }),
      tx.groundHandlingSession.count({ where: { siteId } }),
    ]);

    if (pointCount > 0 || sessionCount > 0) {
      throw new ReferenceDataInUseError(
        "Ce site a encore des points ou des séances de gonflage associés : supprimez-les d'abord.",
      );
    }

    await tx.site.delete({ where: { id: siteId } });
  });
}
