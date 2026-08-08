import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ActivityNotFoundError } from "@/features/activities";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { createFlight } from "./create-flight.service";
import { updateFlight } from "./update-flight.service";

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let otherUserId: string;
let siteId: string;
let schoolId: string;
let trainingCampId: string;
let otherUserTrainingCampId: string;
let flightId: string;
let activityId: string;

const validFlightInput = {
  date: "2025-01-15",
  takeoffAltitudeM: "1200",
  landingAltitudeM: "450",
  durationMin: "35",
  flightType: "LOCAL",
  observations: "Integration test flight.",
  improvementPoints: "Work on approach phases.",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, site, school] = await Promise.all([
    prisma.user.create({
      data: {
        email: `update-flight-${suffix}@paragliding-logbook.local`,
        name: "Update Flight Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `update-flight-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
    prisma.site.create({ data: { name: `Update Flight Test Site ${suffix}` } }),
    prisma.school.create({ data: { name: `Update Flight Test School ${suffix}` } }),
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

  const otherUserTrainingCamp = await createTrainingCamp(otherUserId, {
    startDate: "2025-01-10",
    endDate: "2025-01-20",
    schoolId,
    campType: "Stage d'un autre utilisateur",
  });
  otherUserTrainingCampId = otherUserTrainingCamp.id;

  const flight = await createFlight(userId, { ...validFlightInput, siteId });
  flightId = flight.id;
  activityId = flight.activityId;
});

afterAll(async () => {
  await prisma.flight.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.trainingCamp.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.site.delete({ where: { id: siteId } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("updateFlight (integration)", () => {
  it("updates the Flight with the submitted data", async () => {
    const updated = await updateFlight(userId, activityId, {
      ...validFlightInput,
      siteId,
      durationMin: "50",
      observations: "Updated observations.",
    });

    expect(updated.id).toBe(flightId);
    expect(updated.durationMin).toBe(50);
    expect(updated.observations).toBe("Updated observations.");
  });

  it("clears an optional field when it is omitted from the input", async () => {
    await updateFlight(userId, activityId, {
      ...validFlightInput,
      siteId,
      trainingCampId,
      date: "2025-01-12",
    });

    const withCamp = await updateFlight(userId, activityId, { ...validFlightInput, siteId });

    expect(withCamp.trainingCampId).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(
      updateFlight(userId, activityId, { ...validFlightInput, siteId, durationMin: "-10" }),
    ).rejects.toThrow();
  });

  it("throws ActivityNotFoundError when the activity does not exist", async () => {
    await expect(
      updateFlight(userId, crypto.randomUUID(), { ...validFlightInput, siteId }),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  it("throws ActivityNotFoundError when the activity belongs to another user", async () => {
    await expect(
      updateFlight(otherUserId, activityId, { ...validFlightInput, siteId }),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  // Règle métier docs/domain-model.md (Stage), identique à la création.
  describe("with a trainingCampId", () => {
    it("fails when the flight date is outside the training camp's interval", async () => {
      await expect(
        updateFlight(userId, activityId, {
          ...validFlightInput,
          siteId,
          trainingCampId,
          date: "2025-01-25",
        }),
      ).rejects.toThrow();
    });

    it("fails when the training camp belongs to another user", async () => {
      await expect(
        updateFlight(userId, activityId, {
          ...validFlightInput,
          siteId,
          trainingCampId: otherUserTrainingCampId,
          date: "2025-01-12",
        }),
      ).rejects.toThrow();
    });
  });
});
