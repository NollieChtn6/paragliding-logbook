import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { sitePointSchema } from "@/lib/validations/site-point";

export async function updateSitePoint(sitePointId: string, rawInput: unknown) {
  const input = sitePointSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const [site, sitePointType] = await Promise.all([
      tx.site.findUnique({ where: { id: input.siteId } }),
      tx.sitePointType.findUnique({ where: { id: input.sitePointTypeId } }),
    ]);
    if (!site) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["siteId"],
        message: "Ce site n'existe pas.",
      };
      throw new ZodError([issue]);
    }
    if (!sitePointType) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["sitePointTypeId"],
        message: "Ce type de point n'existe pas.",
      };
      throw new ZodError([issue]);
    }

    return tx.sitePoint.update({
      where: { id: sitePointId },
      // orientationDeg ?? null : un update Prisma ignore les champs
      // undefined au lieu de les effacer (même principe qu'update-site.service.ts).
      data: {
        label: input.label,
        siteId: input.siteId,
        sitePointTypeId: input.sitePointTypeId,
        latitude: input.latitude,
        longitude: input.longitude,
        altitudeM: input.altitudeM,
        orientationDeg: input.orientationDeg ?? null,
      },
    });
  });
}
