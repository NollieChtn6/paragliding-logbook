import { prisma } from "@/lib/prisma";

export async function getSchool(schoolId: string) {
  return prisma.school.findUnique({ where: { id: schoolId } });
}

export type School = NonNullable<Awaited<ReturnType<typeof getSchool>>>;
