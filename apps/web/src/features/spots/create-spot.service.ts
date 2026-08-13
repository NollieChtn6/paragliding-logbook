import { prisma } from "@/lib/prisma";
import { spotSchema } from "@/lib/validations/spot";
import type { Messages } from "@/messages";

export async function createSpot(rawInput: unknown, t: Messages["validation"]["spot"]) {
  const input = spotSchema(t).parse(rawInput);
  return prisma.spot.create({ data: input });
}
