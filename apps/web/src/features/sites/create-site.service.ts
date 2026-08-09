import { prisma } from "@/lib/prisma";
import { siteSchema } from "@/lib/validations/site";

export async function createSite(rawInput: unknown) {
  const input = siteSchema.parse(rawInput);
  return prisma.site.create({ data: input });
}
