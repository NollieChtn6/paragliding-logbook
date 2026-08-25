import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createQualification } from "./create-qualification.service";

const t = getDictionary("fr-FR").validation.qualification;

// Fixtures propres à ce test, indépendantes du seed dev
// (apps/web/prisma/seed.ts et prisma/seed-qualification-types.ts).
let userId: string;
let otherUserId: string;
let schoolId: string;
let qualificationTypeId: string;
let trainingCampId: string;
let otherUserTrainingCampId: string;

const validQualificationInput = {
  obtainedDate: "2025-01-10",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, school, qualificationType, trainingCampType, activityType] =
    await Promise.all([
      prisma.user.create({
        data: {
          email: `integration-test-qual-${suffix}@paragliding-logbook.local`,
          name: "Integration Test User",
        },
      }),
      prisma.user.create({
        data: {
          email: `integration-test-qual-other-${suffix}@paragliding-logbook.local`,
          name: "Other Integration Test User",
        },
      }),
      prisma.school.create({
        data: { name: `Integration Test School ${suffix}` },
      }),
      prisma.qualificationType.upsert({
        where: { code: "PILOT" },
        update: {},
        create: { code: "PILOT" },
      }),
      prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
      prisma.activityType.findUniqueOrThrow({ where: { code: "TRAINING_CAMP" } }),
    ]);
  userId = user.id;
  otherUserId = otherUser.id;
  schoolId = school.id;
  qualificationTypeId = qualificationType.id;

  const [activity, otherActivity] = await Promise.all([
    prisma.activity.create({ data: { userId, activityTypeId: activityType.id } }),
    prisma.activity.create({ data: { userId: otherUserId, activityTypeId: activityType.id } }),
  ]);

  const [trainingCamp, otherUserTrainingCamp] = await Promise.all([
    prisma.trainingCamp.create({
      data: {
        activityId: activity.id,
        schoolId,
        trainingCampTypeId: trainingCampType.id,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-20"),
      },
    }),
    prisma.trainingCamp.create({
      data: {
        activityId: otherActivity.id,
        schoolId,
        trainingCampTypeId: trainingCampType.id,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-20"),
      },
    }),
  ]);
  trainingCampId = trainingCamp.id;
  otherUserTrainingCampId = otherUserTrainingCamp.id;
});

afterAll(async () => {
  await prisma.qualification.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.trainingCamp.deleteMany({
    where: { id: { in: [trainingCampId, otherUserTrainingCampId] } },
  });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("createQualification (integration)", () => {
  describe("with valid data", () => {
    let qualificationId: string;

    beforeAll(async () => {
      const qualification = await createQualification(
        userId,
        {
          ...validQualificationInput,
          qualificationTypeId,
          schoolId,
          trainingCampId,
          notes: "Obtenu après un stage de 5 jours.",
        },
        t,
      );
      qualificationId = qualification.id;
    });

    it("creates the Qualification with the submitted data, linked to the right user", async () => {
      const qualification = await prisma.qualification.findUniqueOrThrow({
        where: { id: qualificationId },
      });
      expect(qualification.userId).toBe(userId);
      expect(qualification.qualificationTypeId).toBe(qualificationTypeId);
      expect(qualification.schoolId).toBe(schoolId);
      expect(qualification.trainingCampId).toBe(trainingCampId);
      expect(qualification.notes).toBe("Obtenu après un stage de 5 jours.");
    });
  });

  it("creates a qualification without school or training camp", async () => {
    const qualification = await createQualification(
      userId,
      { ...validQualificationInput, qualificationTypeId },
      t,
    );
    expect(qualification.schoolId).toBeNull();
    expect(qualification.trainingCampId).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(
      createQualification(
        userId,
        { ...validQualificationInput, qualificationTypeId, obtainedDate: "not-a-date" },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the qualification type does not exist", async () => {
    await expect(
      createQualification(
        userId,
        { ...validQualificationInput, qualificationTypeId: crypto.randomUUID() },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the school does not exist", async () => {
    await expect(
      createQualification(
        userId,
        { ...validQualificationInput, qualificationTypeId, schoolId: crypto.randomUUID() },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the training camp does not exist", async () => {
    await expect(
      createQualification(
        userId,
        { ...validQualificationInput, qualificationTypeId, trainingCampId: crypto.randomUUID() },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the training camp belongs to another user", async () => {
    await expect(
      createQualification(
        userId,
        {
          ...validQualificationInput,
          qualificationTypeId,
          trainingCampId: otherUserTrainingCampId,
        },
        t,
      ),
    ).rejects.toThrow();
  });
});
