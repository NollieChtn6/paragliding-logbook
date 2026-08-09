import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { sitePointSchema } from "@/lib/validations/site-point";

// Vérifie l'existence du site et du type avant création (docs/admin.md >
// Validations, "relations") : un message clair plutôt qu'une violation de
// contrainte FK brute. Site et SitePointType sont des données de référence
// partagées, pas de contrôle de propriété nécessaire (à la différence d'un
// trainingCampId, par exemple).
export async function createSitePoint(rawInput: unknown) {
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

    return tx.sitePoint.create({ data: input });
  });
}
