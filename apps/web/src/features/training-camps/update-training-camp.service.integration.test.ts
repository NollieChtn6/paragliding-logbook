import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ActivityNotFoundError } from "@/features/activities";
import { prisma } from "@/lib/prisma";
import { createTrainingCamp } from "./create-training-camp.service";
import { updateTrainingCamp } from "./update-training-camp.service";

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let otherUserId: string;
let schoolId: string;
let trainingCampId: string;
let activityId: string;

const validTrainingCampInput = {
  startDate: "2025-01-10",
  endDate: "2025-01-15",
  campType: "Perfectionnement",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, school] = await Promise.all([
    prisma.user.create({
      data: {
        email: `update-tc-${suffix}@paragliding-logbook.local`,
        name: "Update Training Camp Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `update-tc-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
    prisma.school.create({ data: { name: `Update Training Camp Test School ${suffix}` } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  schoolId = school.id;

  const trainingCamp = await createTrainingCamp(userId, { ...validTrainingCampInput, schoolId });
  trainingCampId = trainingCamp.id;
  activityId = trainingCamp.activityId;
});

afterAll(async () => {
  await prisma.trainingCamp.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("updateTrainingCamp (integration)", () => {
  it("updates the TrainingCamp with the submitted data", async () => {
    const updated = await updateTrainingCamp(userId, activityId, {
      ...validTrainingCampInput,
      schoolId,
      campType: "Initiation",
      summary: "Bilan mis à jour.",
      certification: "Brevet de pilote",
    });

    expect(updated.id).toBe(trainingCampId);
    expect(updated.campType).toBe("Initiation");
    expect(updated.summary).toBe("Bilan mis à jour.");
    expect(updated.certification).toBe("Brevet de pilote");
  });

  it("clears an optional field when it is omitted from the input", async () => {
    const updated = await updateTrainingCamp(userId, activityId, {
      ...validTrainingCampInput,
      schoolId,
    });

    expect(updated.summary).toBeNull();
    expect(updated.certification).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(
      updateTrainingCamp(userId, activityId, {
        ...validTrainingCampInput,
        schoolId,
        startDate: "2025-01-15",
        endDate: "2025-01-10",
      }),
    ).rejects.toThrow();
  });

  it("throws ActivityNotFoundError when the activity does not exist", async () => {
    await expect(
      updateTrainingCamp(userId, crypto.randomUUID(), { ...validTrainingCampInput, schoolId }),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  it("throws ActivityNotFoundError when the activity belongs to another user", async () => {
    await expect(
      updateTrainingCamp(otherUserId, activityId, { ...validTrainingCampInput, schoolId }),
    ).rejects.toThrow(ActivityNotFoundError);
  });
});
