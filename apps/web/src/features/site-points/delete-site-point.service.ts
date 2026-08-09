import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";

// Relations directes de SitePoint (schema.prisma) : flightsAsTakeoff et
// flightsAsLanding. Bloquer si l'une des deux est non vide (docs/admin.md >
// Suppression, "supprimer un SitePoint ne doit pas supprimer des Flight").
export async function deleteSitePoint(sitePointId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [takeoffCount, landingCount] = await Promise.all([
      tx.flight.count({ where: { takeoffPointId: sitePointId } }),
      tx.flight.count({ where: { landingPointId: sitePointId } }),
    ]);

    if (takeoffCount > 0 || landingCount > 0) {
      throw new ReferenceDataInUseError(
        "Ce point est encore utilisé par au moins un vol : il ne peut pas être supprimé.",
      );
    }

    await tx.sitePoint.delete({ where: { id: sitePointId } });
  });
}
