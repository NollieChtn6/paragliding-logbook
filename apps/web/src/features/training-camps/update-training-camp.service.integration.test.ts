import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ActivityNotFoundError } from "@/features/activities";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createTrainingCamp } from "./create-training-camp.service";
import { updateTrainingCamp } from "./update-training-camp.service";

const t = getDictionary("fr-FR").validation.trainingCamp;

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let otherUserId: string;
let schoolId: string;
let trainingCampTypeId: string;
let otherTrainingCampTypeId: string;
let qualificationTypeId: string;
let trainingCampId: string;
let activityId: string;

const validTrainingCampInput = {
  startDate: "2025-01-10",
  endDate: "2025-01-15",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, school, trainingCampType, otherTrainingCampType, qualificationType] =
    await Promise.all([
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
      prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
      prisma.trainingCampType.findUniqueOrThrow({ where: { code: "INITIATION" } }),
      prisma.qualificationType.upsert({
        where: { code: "PILOT" },
        update: {},
        create: { code: "PILOT" },
      }),
    ]);
  userId = user.id;
  otherUserId = otherUser.id;
  schoolId = school.id;
  trainingCampTypeId = trainingCampType.id;
  otherTrainingCampTypeId = otherTrainingCampType.id;
  qualificationTypeId = qualificationType.id;

  const trainingCamp = await createTrainingCamp(
    userId,
    {
      ...validTrainingCampInput,
      schoolId,
      trainingCampTypeId,
    },
    t,
  );
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
    const updated = await updateTrainingCamp(
      userId,
      activityId,
      {
        ...validTrainingCampInput,
        schoolId,
        trainingCampTypeId: otherTrainingCampTypeId,
        observations: "Observations mises à jour.",
        summary: "Bilan mis à jour.",
        qualificationTypeId,
      },
      t,
    );

    expect(updated.id).toBe(trainingCampId);
    expect(updated.trainingCampTypeId).toBe(otherTrainingCampTypeId);
    expect(updated.observations).toBe("Observations mises à jour.");
    expect(updated.summary).toBe("Bilan mis à jour.");
    expect(updated.qualificationTypeId).toBe(qualificationTypeId);
  });

  it("clears an optional field when it is omitted from the input", async () => {
    const updated = await updateTrainingCamp(
      userId,
      activityId,
      {
        ...validTrainingCampInput,
        schoolId,
        trainingCampTypeId,
      },
      t,
    );

    expect(updated.observations).toBeNull();
    expect(updated.summary).toBeNull();
    expect(updated.qualificationTypeId).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(
      updateTrainingCamp(
        userId,
        activityId,
        {
          ...validTrainingCampInput,
          schoolId,
          trainingCampTypeId,
          startDate: "2025-01-15",
          endDate: "2025-01-10",
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the training camp type does not exist", async () => {
    await expect(
      updateTrainingCamp(
        userId,
        activityId,
        {
          ...validTrainingCampInput,
          schoolId,
          trainingCampTypeId: crypto.randomUUID(),
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the qualification type does not exist", async () => {
    await expect(
      updateTrainingCamp(
        userId,
        activityId,
        {
          ...validTrainingCampInput,
          schoolId,
          trainingCampTypeId,
          qualificationTypeId: crypto.randomUUID(),
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("throws ActivityNotFoundError when the activity does not exist", async () => {
    await expect(
      updateTrainingCamp(
        userId,
        crypto.randomUUID(),
        {
          ...validTrainingCampInput,
          schoolId,
          trainingCampTypeId,
        },
        t,
      ),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  it("throws ActivityNotFoundError when the activity belongs to another user", async () => {
    await expect(
      updateTrainingCamp(
        otherUserId,
        activityId,
        {
          ...validTrainingCampInput,
          schoolId,
          trainingCampTypeId,
        },
        t,
      ),
    ).rejects.toThrow(ActivityNotFoundError);
  });
});
