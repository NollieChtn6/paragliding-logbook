import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ActivityNotFoundError } from "@/features/activities";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { createGroundHandlingSession } from "./create-ground-handling-session.service";
import { updateGroundHandlingSession } from "./update-ground-handling-session.service";

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let otherUserId: string;
let siteId: string;
let schoolId: string;
let trainingCampId: string;
let groundHandlingSessionId: string;
let activityId: string;

const validGroundHandlingInput = {
  date: "2025-01-15",
  durationMin: "30",
  exercises: "Contrôle au sol, gestion des surventes.",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, site, school] = await Promise.all([
    prisma.user.create({
      data: {
        email: `update-ghs-${suffix}@paragliding-logbook.local`,
        name: "Update Ground Handling Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `update-ghs-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
    prisma.site.create({ data: { name: `Update Ground Handling Test Site ${suffix}` } }),
    prisma.school.create({ data: { name: `Update Ground Handling Test School ${suffix}` } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  siteId = site.id;
  schoolId = school.id;

  const trainingCamp = await createTrainingCamp(userId, {
    startDate: "2025-01-10",
    endDate: "2025-01-20",
    schoolId,
    campType: "Perfectionnement",
  });
  trainingCampId = trainingCamp.id;

  const groundHandlingSession = await createGroundHandlingSession(userId, {
    ...validGroundHandlingInput,
    siteId,
  });
  groundHandlingSessionId = groundHandlingSession.id;
  activityId = groundHandlingSession.activityId;
});

afterAll(async () => {
  await prisma.groundHandlingSession.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.trainingCamp.deleteMany({ where: { activity: { userId } } });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.site.delete({ where: { id: siteId } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("updateGroundHandlingSession (integration)", () => {
  it("updates the GroundHandlingSession with the submitted data", async () => {
    const updated = await updateGroundHandlingSession(userId, activityId, {
      ...validGroundHandlingInput,
      siteId,
      durationMin: "45",
      difficulties: "Vent de travers.",
      feeling: "Progrès sur la gestion des surventes.",
    });

    expect(updated.id).toBe(groundHandlingSessionId);
    expect(updated.durationMin).toBe(45);
    expect(updated.difficulties).toBe("Vent de travers.");
    expect(updated.feeling).toBe("Progrès sur la gestion des surventes.");
  });

  it("clears an optional field when it is omitted from the input", async () => {
    await updateGroundHandlingSession(userId, activityId, {
      ...validGroundHandlingInput,
      siteId,
      trainingCampId,
      date: "2025-01-12",
    });

    const withoutCamp = await updateGroundHandlingSession(userId, activityId, {
      ...validGroundHandlingInput,
      siteId,
    });

    expect(withoutCamp.trainingCampId).toBeNull();
    expect(withoutCamp.difficulties).toBeNull();
    expect(withoutCamp.feeling).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(
      updateGroundHandlingSession(userId, activityId, {
        ...validGroundHandlingInput,
        siteId,
        durationMin: "-10",
      }),
    ).rejects.toThrow();
  });

  it("throws ActivityNotFoundError when the activity does not exist", async () => {
    await expect(
      updateGroundHandlingSession(userId, crypto.randomUUID(), {
        ...validGroundHandlingInput,
        siteId,
      }),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  it("throws ActivityNotFoundError when the activity belongs to another user", async () => {
    await expect(
      updateGroundHandlingSession(otherUserId, activityId, { ...validGroundHandlingInput, siteId }),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  // Règle métier docs/domain-model.md (Stage), identique à la création.
  describe("with a trainingCampId", () => {
    it("fails when the session date is outside the training camp's interval", async () => {
      await expect(
        updateGroundHandlingSession(userId, activityId, {
          ...validGroundHandlingInput,
          siteId,
          trainingCampId,
          date: "2025-01-25",
        }),
      ).rejects.toThrow();
    });
  });
});
