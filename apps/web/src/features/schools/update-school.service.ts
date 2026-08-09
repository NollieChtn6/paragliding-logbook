import { prisma } from "@/lib/prisma";
import { schoolSchema } from "@/lib/validations/school";

export async function updateSchool(schoolId: string, rawInput: unknown) {
  const input = schoolSchema.parse(rawInput);
  return prisma.school.update({
    where: { id: schoolId },
    // ?? null : un update Prisma ignore les champs undefined au lieu de les
    // effacer, contrairement à create (même principe qu'update-site.service.ts).
    data: {
      name: input.name,
      address: input.address ?? null,
      postalCode: input.postalCode ?? null,
      city: input.city ?? null,
      countryCode: input.countryCode ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      website: input.website ?? null,
    },
  });
}
