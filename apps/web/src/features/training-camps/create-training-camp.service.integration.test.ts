import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTrainingCamp } from "./create-training-camp.service";

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let schoolId: string;
let trainingCampTypeId: string;

const validTrainingCampInput = {
  startDate: "2025-01-10",
  endDate: "2025-01-15",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, school, trainingCampType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-tc-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.school.create({
      data: { name: `Integration Test School ${suffix}` },
    }),
    prisma.trainingCampType.findUniqueOrThrow({ where: { code: "PROGRESSION" } }),
  ]);
  userId = user.id;
  schoolId = school.id;
  trainingCampTypeId = trainingCampType.id;
});

afterAll(async () => {
  await prisma.trainingCamp.deleteMany({ where: { activity: { userId } } });
  await prisma.activity.deleteMany({ where: { userId } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("createTrainingCamp (integration)", () => {
  describe("with valid data", () => {
    let trainingCampId: string;
    let activityId: string;

    beforeAll(async () => {
      const trainingCamp = await createTrainingCamp(userId, {
        ...validTrainingCampInput,
        schoolId,
        trainingCampTypeId,
      });
      trainingCampId = trainingCamp.id;
      activityId = trainingCamp.activityId;
    });

    it("creates the Activity with the TRAINING_CAMP type and the right user", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { activityType: true },
      });
      expect(activity.userId).toBe(userId);
      expect(activity.activityType.code).toBe("TRAINING_CAMP");
    });

    it("creates the TrainingCamp with the submitted data", async () => {
      const trainingCamp = await prisma.trainingCamp.findUniqueOrThrow({
        where: { id: trainingCampId },
      });
      expect(trainingCamp.schoolId).toBe(schoolId);
      expect(trainingCamp.trainingCampTypeId).toBe(trainingCampTypeId);
    });

    it("links the TrainingCamp to its Activity", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { trainingCamp: true },
      });
      expect(activity.trainingCamp?.id).toBe(trainingCampId);
    });
  });

  it("fails with invalid data", async () => {
    await expect(
      createTrainingCamp(userId, {
        ...validTrainingCampInput,
        schoolId,
        trainingCampTypeId,
        startDate: "2025-01-15",
        endDate: "2025-01-10",
      }),
    ).rejects.toThrow();
  });

  it("fails when the training camp type does not exist", async () => {
    await expect(
      createTrainingCamp(userId, {
        ...validTrainingCampInput,
        schoolId,
        trainingCampTypeId: crypto.randomUUID(),
      }),
    ).rejects.toThrow();
  });
});
