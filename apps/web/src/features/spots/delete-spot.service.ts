import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";

// Relations directes de Spot (schema.prisma) : sites et
// groundHandlingSessions. Bloquer la suppression si l'une des deux est non
// vide protège transitivement les Flight (référencés via Site, jamais
// directement via Spot) sans que ce service ait besoin de connaître Flight
// — docs/admin.md > Suppression : jamais de cascade silencieuse.
export async function deleteSpot(spotId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [siteCount, sessionCount] = await Promise.all([
      tx.site.count({ where: { spotId } }),
      tx.groundHandlingSession.count({ where: { spotId } }),
    ]);

    if (siteCount > 0 || sessionCount > 0) {
      throw new ReferenceDataInUseError(
        "Ce spot a encore des sites ou des séances de gonflage associés : supprimez-les d'abord.",
      );
    }

    await tx.spot.delete({ where: { id: spotId } });
  });
}
