import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createGroundHandlingSession } from "./create-ground-handling-session.service";

const t = getDictionary("fr-FR").validation.groundHandling;
const trainingCampMessages = getDictionary("fr-FR").validation.trainingCamp;

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let otherUserId: string;
let spotId: string;
let schoolId: string;
let trainingCampTypeId: string;
let trainingCampId: string;
let otherUserTrainingCampId: string;

const validGroundHandlingInput = {
  date: "2025-01-15",
  time: "10:00",
  durationMin: "30",
  exercises: "Contrôle au sol, gestion des surventes.",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-ghs-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `integration-test-ghs-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;

  const spot = await prisma.spot.create({
    data: { name: `Integration Test Spot ${suffix}` },
  });
  spotId = spot.id;

  const [school, trainingCampType] = await Promise.all([
    prisma.school.create({
      data: { name: `Integration Test School GHS ${suffix}` },
    }),
    prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
  ]);
  schoolId = school.id;
  trainingCampTypeId = trainingCampType.id;

  const trainingCamp = await createTrainingCamp(
    userId,
    {
      startDate: "2025-01-10",
      endDate: "2025-01-20",
      schoolId,
      trainingCampTypeId,
    },
    trainingCampMessages,
  );
  trainingCampId = trainingCamp.id;

  const otherUserTrainingCamp = await createTrainingCamp(
    otherUserId,
    {
      startDate: "2025-01-10",
      endDate: "2025-01-20",
      schoolId,
      trainingCampTypeId,
    },
    trainingCampMessages,
  );
  otherUserTrainingCampId = otherUserTrainingCamp.id;
});

afterAll(async () => {
  await prisma.groundHandlingSession.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.trainingCamp.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.spot.delete({ where: { id: spotId } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("createGroundHandlingSession (integration)", () => {
  describe("with valid data", () => {
    let groundHandlingSessionId: string;
    let activityId: string;

    beforeAll(async () => {
      const groundHandlingSession = await createGroundHandlingSession(
        userId,
        {
          ...validGroundHandlingInput,
          spotId,
        },
        t,
      );
      groundHandlingSessionId = groundHandlingSession.id;
      activityId = groundHandlingSession.activityId;
    });

    it("creates the Activity with the GROUND_HANDLING type and the right user", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { activityType: true },
      });
      expect(activity.userId).toBe(userId);
      expect(activity.activityType.code).toBe("GROUND_HANDLING");
    });

    it("creates the GroundHandlingSession with the submitted data", async () => {
      const groundHandlingSession = await prisma.groundHandlingSession.findUniqueOrThrow({
        where: { id: groundHandlingSessionId },
      });
      expect(groundHandlingSession.spotId).toBe(spotId);
      expect(groundHandlingSession.durationMin).toBe(30);
      expect(groundHandlingSession.exercises).toBe("Contrôle au sol, gestion des surventes.");
    });

    it("links the GroundHandlingSession to its Activity", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { groundHandlingSession: true },
      });
      expect(activity.groundHandlingSession?.id).toBe(groundHandlingSessionId);
    });
  });

  it("fails with invalid data", async () => {
    await expect(
      createGroundHandlingSession(
        userId,
        {
          ...validGroundHandlingInput,
          spotId,
          durationMin: "-10",
        },
        t,
      ),
    ).rejects.toThrow();
  });

  // Règle métier docs/domain-model.md (Stage) : une séance rattachée à un
  // stage doit avoir une date dans l'intervalle du stage.
  describe("with a trainingCampId", () => {
    it("succeeds when the session date is within the training camp's interval", async () => {
      const groundHandlingSession = await createGroundHandlingSession(
        userId,
        {
          ...validGroundHandlingInput,
          spotId,
          trainingCampId,
          date: "2025-01-12",
        },
        t,
      );
      expect(groundHandlingSession.trainingCampId).toBe(trainingCampId);
    });

    // Régression : voir create-flight.service.integration.test.ts (même
    // raisonnement, comparaison au jour près requise).
    it("succeeds for a late-evening session on the training camp's exact end date", async () => {
      const groundHandlingSession = await createGroundHandlingSession(
        userId,
        {
          ...validGroundHandlingInput,
          spotId,
          trainingCampId,
          date: "2025-01-20",
          time: "22:30",
        },
        t,
      );
      expect(groundHandlingSession.trainingCampId).toBe(trainingCampId);
    });

    it("fails when the session date is before the training camp's start date", async () => {
      await expect(
        createGroundHandlingSession(
          userId,
          {
            ...validGroundHandlingInput,
            spotId,
            trainingCampId,
            date: "2025-01-05",
          },
          t,
        ),
      ).rejects.toThrow();
    });

    it("fails when the session date is after the training camp's end date", async () => {
      await expect(
        createGroundHandlingSession(
          userId,
          {
            ...validGroundHandlingInput,
            spotId,
            trainingCampId,
            date: "2025-01-25",
          },
          t,
        ),
      ).rejects.toThrow();
    });

    it("fails when the training camp belongs to another user", async () => {
      await expect(
        createGroundHandlingSession(
          userId,
          {
            ...validGroundHandlingInput,
            spotId,
            trainingCampId: otherUserTrainingCampId,
            date: "2025-01-12",
          },
          t,
        ),
      ).rejects.toThrow();
    });
  });
});
