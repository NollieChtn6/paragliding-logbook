import { ZodError, type ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { siteSchema } from "@/lib/validations/site";
import type { Messages } from "@/messages";

// Vérifie l'existence du spot et du type avant création (docs/admin.md >
// Validations, "relations") : un message clair plutôt qu'une violation de
// contrainte FK brute. Spot et SiteType sont des données de référence
// partagées, pas de contrôle de propriété nécessaire (à la différence d'un
// trainingCampId, par exemple).
export async function createSite(rawInput: unknown, t: Messages["validation"]["site"]) {
  const input = siteSchema(t).parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const [spot, siteType] = await Promise.all([
      tx.spot.findUnique({ where: { id: input.spotId } }),
      tx.siteType.findUnique({ where: { id: input.siteTypeId } }),
    ]);
    if (!spot) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["spotId"],
        message: t.spotNotFound,
      };
      throw new ZodError([issue]);
    }
    if (!siteType) {
      const issue: ZodIssue = {
        code: "custom",
        path: ["siteTypeId"],
        message: t.siteTypeNotFound,
      };
      throw new ZodError([issue]);
    }

    return tx.site.create({ data: input });
  });
}
