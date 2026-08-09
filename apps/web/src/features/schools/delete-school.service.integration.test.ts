import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { createSchool } from "./create-school.service";
import { deleteSchool } from "./delete-school.service";

const createdSchoolIds: string[] = [];

afterAll(async () => {
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  await prisma.$disconnect();
});

describe("deleteSchool (integration)", () => {
  it("deletes a school with no associated training camps", async () => {
    const suffix = crypto.randomUUID();
    const school = await createSchool({ name: `Delete School Test ${suffix}` });
    createdSchoolIds.push(school.id);

    await deleteSchool(school.id);

    const found = await prisma.school.findUnique({ where: { id: school.id } });
    expect(found).toBeNull();
    createdSchoolIds.pop();
  });

  it("refuses to delete a school that still has training camps", async () => {
    const suffix = crypto.randomUUID();
    const school = await createSchool({ name: `Delete School With Camp Test ${suffix}` });
    createdSchoolIds.push(school.id);

    const [user, activityType, trainingCampType] = await Promise.all([
      prisma.user.create({
        data: { email: `delete-school-${suffix}@paragliding-logbook.local`, name: "Test User" },
      }),
      prisma.activityType.findUniqueOrThrow({ where: { code: "TRAINING_CAMP" } }),
      prisma.trainingCampType.findFirstOrThrow(),
    ]);
    const activity = await prisma.activity.create({
      data: { userId: user.id, activityTypeId: activityType.id },
    });
    await prisma.trainingCamp.create({
      data: {
        activityId: activity.id,
        schoolId: school.id,
        trainingCampTypeId: trainingCampType.id,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-05"),
      },
    });

    await expect(deleteSchool(school.id)).rejects.toThrow(ReferenceDataInUseError);

    await prisma.trainingCamp.deleteMany({ where: { activityId: activity.id } });
    await prisma.activity.deleteMany({ where: { id: activity.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  });
});
