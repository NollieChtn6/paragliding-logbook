import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { createFlight } from "./create-flight.service";

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let siteId: string;
let schoolId: string;
let trainingCampId: string;

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

  const user = await prisma.user.create({
    data: {
      email: `integration-test-${suffix}@paragliding-logbook.local`,
      name: "Integration Test User",
    },
  });
  userId = user.id;

  const site = await prisma.site.create({
    data: { name: `Integration Test Site ${suffix}` },
  });
  siteId = site.id;

  const school = await prisma.school.create({
    data: { name: `Integration Test School ${suffix}` },
  });
  schoolId = school.id;

  const trainingCamp = await createTrainingCamp(userId, {
    startDate: "2025-01-10",
    endDate: "2025-01-20",
    schoolId,
    campType: "Perfectionnement",
  });
  trainingCampId = trainingCamp.id;
});

afterAll(async () => {
  await prisma.flight.deleteMany({ where: { activity: { userId } } });
  await prisma.trainingCamp.deleteMany({ where: { activity: { userId } } });
  await prisma.activity.deleteMany({ where: { userId } });
  await prisma.site.delete({ where: { id: siteId } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("createFlight (integration)", () => {
  describe("with valid data", () => {
    let flightId: string;
    let activityId: string;

    beforeAll(async () => {
      const flight = await createFlight(userId, { ...validFlightInput, siteId });
      flightId = flight.id;
      activityId = flight.activityId;
    });

    it("creates the Activity with the FLIGHT type and the right user", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { activityType: true },
      });
      expect(activity.userId).toBe(userId);
      expect(activity.activityType.code).toBe("FLIGHT");
    });

    it("creates the Flight with the submitted data", async () => {
      const flight = await prisma.flight.findUniqueOrThrow({ where: { id: flightId } });
      expect(flight.siteId).toBe(siteId);
      expect(flight.durationMin).toBe(35);
      expect(flight.flightType).toBe("LOCAL");
    });

    it("links the Flight to its Activity", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { flight: true },
      });
      expect(activity.flight?.id).toBe(flightId);
    });
  });

  it("fails with invalid data", async () => {
    await expect(
      createFlight(userId, { ...validFlightInput, siteId, durationMin: "-10" }),
    ).rejects.toThrow();
  });

  // Règle métier docs/domain-model.md (Stage) : un vol rattaché à un stage
  // doit avoir une date dans l'intervalle du stage.
  describe("with a trainingCampId", () => {
    it("succeeds when the flight date is within the training camp's interval", async () => {
      const flight = await createFlight(userId, {
        ...validFlightInput,
        siteId,
        trainingCampId,
        date: "2025-01-12",
      });
      expect(flight.trainingCampId).toBe(trainingCampId);
    });

    it("fails when the flight date is before the training camp's start date", async () => {
      await expect(
        createFlight(userId, {
          ...validFlightInput,
          siteId,
          trainingCampId,
          date: "2025-01-05",
        }),
      ).rejects.toThrow();
    });

    it("fails when the flight date is after the training camp's end date", async () => {
      await expect(
        createFlight(userId, {
          ...validFlightInput,
          siteId,
          trainingCampId,
          date: "2025-01-25",
        }),
      ).rejects.toThrow();
    });
  });
});
