import { prisma } from "@/lib/prisma";
import { schoolSchema } from "@/lib/validations/school";
import type { Messages } from "@/messages";

export async function createSchool(rawInput: unknown, t: Messages["validation"]["school"]) {
  const input = schoolSchema(t).parse(rawInput);
  return prisma.school.create({ data: input });
}
