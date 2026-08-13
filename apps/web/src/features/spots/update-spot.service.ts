import { prisma } from "@/lib/prisma";
import { spotSchema } from "@/lib/validations/spot";
import type { Messages } from "@/messages";

export async function updateSpot(
  spotId: string,
  rawInput: unknown,
  t: Messages["validation"]["spot"],
) {
  const input = spotSchema(t).parse(rawInput);
  return prisma.spot.update({
    where: { id: spotId },
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
