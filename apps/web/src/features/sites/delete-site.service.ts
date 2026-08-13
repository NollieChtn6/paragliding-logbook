import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";

// Relations directes de Site (schema.prisma) : flightsAsTakeoff et
// flightsAsLanding. Bloquer si l'une des deux est non vide (docs/admin.md >
// Suppression, "supprimer un Site ne doit pas supprimer des Flight").
export async function deleteSite(siteId: string, siteInUseMessage: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [takeoffCount, landingCount] = await Promise.all([
      tx.flight.count({ where: { takeoffPointId: siteId } }),
      tx.flight.count({ where: { landingPointId: siteId } }),
    ]);

    if (takeoffCount > 0 || landingCount > 0) {
      throw new ReferenceDataInUseError(siteInUseMessage);
    }

    await tx.site.delete({ where: { id: siteId } });
  });
}
