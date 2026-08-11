import { prisma } from "@/lib/prisma";
import { spotSchema } from "@/lib/validations/spot";

export async function createSpot(rawInput: unknown) {
  const input = spotSchema.parse(rawInput);
  return prisma.spot.create({ data: input });
}
