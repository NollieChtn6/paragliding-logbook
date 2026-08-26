import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ActivityNotFoundError } from "@/features/activities";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createGroundHandlingSession } from "./create-ground-handling-session.service";
import { updateGroundHandlingSession } from "./update-ground-handling-session.service";

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
let groundHandlingSessionId: string;
let activityId: string;
let wingId: string;
let otherUserWingId: string;

const validGroundHandlingInput = {
  date: "2025-01-15",
  time: "10:00",
  durationMin: "30",
  exercises: "Contrôle au sol, gestion des surventes.",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, spot, school, trainingCampType] = await Promise.all([
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
    prisma.spot.create({ data: { name: `Update Ground Handling Test Spot ${suffix}` } }),
    prisma.school.create({ data: { name: `Update Ground Handling Test School ${suffix}` } }),
    prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  spotId = spot.id;
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

  const wingType = await prisma.equipmentType.upsert({
    where: { code: "WING" },
    update: {},
    create: { code: "WING" },
  });
  const [wing, otherUserWing] = await Promise.all([
    prisma.equipment.create({
      data: {
        userId,
        equipmentTypeId: wingType.id,
        brand: "Ozone",
        model: "Rush 6",
        purchaseDate: new Date("2024-01-01"),
        condition: "NEW",
      },
    }),
    prisma.equipment.create({
      data: {
        userId: otherUserId,
        equipmentTypeId: wingType.id,
        brand: "Gin",
        model: "Explorer",
        purchaseDate: new Date("2024-01-01"),
        condition: "NEW",
      },
    }),
  ]);
  wingId = wing.id;
  otherUserWingId = otherUserWing.id;

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
  await prisma.equipment.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("updateGroundHandlingSession (integration)", () => {
  it("updates the GroundHandlingSession with the submitted data", async () => {
    const updated = await updateGroundHandlingSession(
      userId,
      activityId,
      {
        ...validGroundHandlingInput,
        spotId,
        durationMin: "45",
        difficulties: "Vent de travers.",
        feeling: "Progrès sur la gestion des surventes.",
      },
      t,
    );

    expect(updated.id).toBe(groundHandlingSessionId);
    expect(updated.durationMin).toBe(45);
    expect(updated.difficulties).toBe("Vent de travers.");
    expect(updated.feeling).toBe("Progrès sur la gestion des surventes.");
  });

  it("clears an optional field when it is omitted from the input", async () => {
    await updateGroundHandlingSession(
      userId,
      activityId,
      {
        ...validGroundHandlingInput,
        spotId,
        trainingCampId,
        date: "2025-01-12",
      },
      t,
    );

    const withoutCamp = await updateGroundHandlingSession(
      userId,
      activityId,
      {
        ...validGroundHandlingInput,
        spotId,
      },
      t,
    );

    expect(withoutCamp.trainingCampId).toBeNull();
    expect(withoutCamp.difficulties).toBeNull();
    expect(withoutCamp.feeling).toBeNull();
  });

  it("attaches a wing belonging to the current user, then clears it when omitted", async () => {
    const withWing = await updateGroundHandlingSession(
      userId,
      activityId,
      { ...validGroundHandlingInput, spotId, wingId },
      t,
    );
    expect(withWing.wingId).toBe(wingId);

    const withoutWing = await updateGroundHandlingSession(
      userId,
      activityId,
      { ...validGroundHandlingInput, spotId },
      t,
    );
    expect(withoutWing.wingId).toBeNull();
  });

  it("fails when the wing belongs to another user", async () => {
    await expect(
      updateGroundHandlingSession(
        userId,
        activityId,
        { ...validGroundHandlingInput, spotId, wingId: otherUserWingId },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails with invalid data", async () => {
    await expect(
      updateGroundHandlingSession(
        userId,
        activityId,
        {
          ...validGroundHandlingInput,
          spotId,
          durationMin: "-10",
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("throws ActivityNotFoundError when the activity does not exist", async () => {
    await expect(
      updateGroundHandlingSession(
        userId,
        crypto.randomUUID(),
        {
          ...validGroundHandlingInput,
          spotId,
        },
        t,
      ),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  it("throws ActivityNotFoundError when the activity belongs to another user", async () => {
    await expect(
      updateGroundHandlingSession(
        otherUserId,
        activityId,
        { ...validGroundHandlingInput, spotId },
        t,
      ),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  // Règle métier docs/domain-model.md (Stage), identique à la création.
  describe("with a trainingCampId", () => {
    it("fails when the session date is outside the training camp's interval", async () => {
      await expect(
        updateGroundHandlingSession(
          userId,
          activityId,
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
        updateGroundHandlingSession(
          userId,
          activityId,
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
