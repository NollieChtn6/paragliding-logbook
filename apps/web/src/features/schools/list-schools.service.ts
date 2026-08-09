import { prisma } from "@/lib/prisma";

// School est une donnée de référence partagée (schema.prisma), pas de userId.
export async function listSchools(query?: string) {
  return prisma.school.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
  });
}

export type SchoolListItem = Awaited<ReturnType<typeof listSchools>>[number];
