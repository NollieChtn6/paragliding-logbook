import { prisma } from "@/lib/prisma";
import { siteSchema } from "@/lib/validations/site";

export async function updateSite(siteId: string, rawInput: unknown) {
  const input = siteSchema.parse(rawInput);
  return prisma.site.update({
    where: { id: siteId },
    // ?? null : un update Prisma ignore les champs undefined au lieu de les
    // effacer, contrairement à create — nécessaire pour permettre de vider
    // un champ optionnel (même principe qu'update-training-camp.service.ts).
    data: {
      name: input.name,
      region: input.region ?? null,
      countryCode: input.countryCode ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    },
  });
}
