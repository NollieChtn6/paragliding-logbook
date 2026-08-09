import { prisma } from "@/lib/prisma";
import { schoolSchema } from "@/lib/validations/school";

export async function createSchool(rawInput: unknown) {
  const input = schoolSchema.parse(rawInput);
  return prisma.school.create({ data: input });
}
