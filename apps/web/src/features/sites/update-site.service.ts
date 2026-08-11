import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { siteSchema } from "@/lib/validations/site";

export async function updateSite(siteId: string, rawInput: unknown) {
  const input = siteSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const [spot, siteType] = await Promise.all([
      tx.spot.findUnique({ where: { id: input.spotId } }),
      tx.siteType.findUnique({ where: { id: input.siteTypeId } }),
    ]);
    if (!spot) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["spotId"],
        message: "Ce spot n'existe pas.",
      };
      throw new ZodError([issue]);
    }
    if (!siteType) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["siteTypeId"],
        message: "Ce type de site n'existe pas.",
      };
      throw new ZodError([issue]);
    }

    return tx.site.update({
      where: { id: siteId },
      // orientationDeg ?? null : un update Prisma ignore les champs
      // undefined au lieu de les effacer (même principe qu'update-spot.service.ts).
      data: {
        label: input.label,
        spotId: input.spotId,
        siteTypeId: input.siteTypeId,
        latitude: input.latitude,
        longitude: input.longitude,
        altitudeM: input.altitudeM,
        orientationDeg: input.orientationDeg ?? null,
      },
    });
  });
}
