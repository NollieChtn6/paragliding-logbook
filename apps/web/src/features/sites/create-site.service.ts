import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { siteSchema } from "@/lib/validations/site";

// Vérifie l'existence du spot et du type avant création (docs/admin.md >
// Validations, "relations") : un message clair plutôt qu'une violation de
// contrainte FK brute. Spot et SiteType sont des données de référence
// partagées, pas de contrôle de propriété nécessaire (à la différence d'un
// trainingCampId, par exemple).
export async function createSite(rawInput: unknown) {
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

    return tx.site.create({ data: input });
  });
}
