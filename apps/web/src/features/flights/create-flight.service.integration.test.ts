import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { createFlight } from "./create-flight.service";

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let otherUserId: string;
let siteId: string;
let otherSiteId: string;
let takeoffPointId: string;
let landingPointId: string;
let otherSiteTakeoffPointId: string;
let flightTypeId: string;
let trainingCampTypeId: string;
let schoolId: string;
let trainingCampId: string;
let otherUserTrainingCampId: string;

const validFlightInput = {
  date: "2025-01-15",
  durationMin: "35",
  observations: "Integration test flight.",
  improvementPoints: "Work on approach phases.",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, takeoffType, landingType, flightType, trainingCampType] =
    await Promise.all([
      prisma.user.create({
        data: {
          email: `integration-test-${suffix}@paragliding-logbook.local`,
          name: "Integration Test User",
        },
      }),
      prisma.user.create({
        data: {
          email: `integration-test-other-${suffix}@paragliding-logbook.local`,
          name: "Other User",
        },
      }),
      prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
      prisma.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
      prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
      prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
    ]);
  userId = user.id;
  otherUserId = otherUser.id;
  flightTypeId = flightType.id;
  trainingCampTypeId = trainingCampType.id;

  const [site, otherSite] = await Promise.all([
    prisma.site.create({ data: { name: `Integration Test Site ${suffix}` } }),
    prisma.site.create({ data: { name: `Integration Test Other Site ${suffix}` } }),
  ]);
  siteId = site.id;
  otherSiteId = otherSite.id;

  const [takeoffPoint, landingPoint, otherSiteTakeoffPoint] = await Promise.all([
    prisma.sitePoint.create({
      data: {
        label: "Takeoff",
        siteId,
        sitePointTypeId: takeoffType.id,
        latitude: 45.9,
        longitude: 6.9,
        altitudeM: 1200,
      },
    }),
    prisma.sitePoint.create({
      data: {
        label: "Landing",
        siteId,
        sitePointTypeId: landingType.id,
        latitude: 45.8,
        longitude: 6.8,
        altitudeM: 450,
      },
    }),
    prisma.sitePoint.create({
      data: {
        label: "Other Site Takeoff",
        siteId: otherSiteId,
        sitePointTypeId: takeoffType.id,
        latitude: 46.0,
        longitude: 7.0,
        altitudeM: 1800,
      },
    }),
  ]);
  takeoffPointId = takeoffPoint.id;
  landingPointId = landingPoint.id;
  otherSiteTakeoffPointId = otherSiteTakeoffPoint.id;

  const school = await prisma.school.create({
    data: { name: `Integration Test School ${suffix}` },
  });
  schoolId = school.id;

  const trainingCamp = await createTrainingCamp(userId, {
    startDate: "2025-01-10",
    endDate: "2025-01-20",
    schoolId,
    trainingCampTypeId,
  });
  trainingCampId = trainingCamp.id;

  const otherUserTrainingCamp = await createTrainingCamp(otherUserId, {
    startDate: "2025-01-10",
    endDate: "2025-01-20",
    schoolId,
    trainingCampTypeId,
  });
  otherUserTrainingCampId = otherUserTrainingCamp.id;
});

afterAll(async () => {
  await prisma.flight.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.trainingCamp.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.sitePoint.deleteMany({ where: { siteId: { in: [siteId, otherSiteId] } } });
  await prisma.site.deleteMany({ where: { id: { in: [siteId, otherSiteId] } } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("createFlight (integration)", () => {
  describe("with valid data", () => {
    let flightId: string;
    let activityId: string;

    beforeAll(async () => {
      const flight = await createFlight(userId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId,
        flightTypeId,
      });
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

    it("creates the Flight with the submitted takeoff and landing points", async () => {
      const flight = await prisma.flight.findUniqueOrThrow({ where: { id: flightId } });
      expect(flight.takeoffPointId).toBe(takeoffPointId);
      expect(flight.landingPointId).toBe(landingPointId);
      expect(flight.durationMin).toBe(35);
      expect(flight.flightTypeId).toBe(flightTypeId);
    });

    it("links the Flight to its Activity", async () => {
      const activity = await prisma.activity.findUniqueOrThrow({
        where: { id: activityId },
        include: { flight: true },
      });
      expect(activity.flight?.id).toBe(flightId);
    });
  });

  it("accepts a takeoff point and a landing point belonging to two different sites", async () => {
    const flight = await createFlight(userId, {
      ...validFlightInput,
      takeoffPointId: otherSiteTakeoffPointId,
      landingPointId,
      flightTypeId,
    });
    expect(flight.takeoffPointId).toBe(otherSiteTakeoffPointId);
    expect(flight.landingPointId).toBe(landingPointId);
  });

  it("fails with invalid data", async () => {
    await expect(
      createFlight(userId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId,
        flightTypeId,
        durationMin: "-10",
      }),
    ).rejects.toThrow();
  });

  it("fails when the takeoff point does not exist", async () => {
    await expect(
      createFlight(userId, {
        ...validFlightInput,
        takeoffPointId: crypto.randomUUID(),
        landingPointId,
        flightTypeId,
      }),
    ).rejects.toThrow();
  });

  it("fails when the landing point does not exist", async () => {
    await expect(
      createFlight(userId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId: crypto.randomUUID(),
        flightTypeId,
      }),
    ).rejects.toThrow();
  });

  // docs/decisions/005-flight-takeoff-landing-points.md : takeoffPointId
  // doit référencer un point TAKEOFF, landingPointId un point LANDING — non
  // exprimable par la seule FK SQL, vérifié dans le service.
  it("fails when the takeoff point is actually a landing point", async () => {
    await expect(
      createFlight(userId, {
        ...validFlightInput,
        takeoffPointId: landingPointId,
        landingPointId,
        flightTypeId,
      }),
    ).rejects.toThrow();
  });

  it("fails when the landing point is actually a takeoff point", async () => {
    await expect(
      createFlight(userId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId: takeoffPointId,
        flightTypeId,
      }),
    ).rejects.toThrow();
  });

  it("fails when the flight type does not exist", async () => {
    await expect(
      createFlight(userId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId,
        flightTypeId: crypto.randomUUID(),
      }),
    ).rejects.toThrow();
  });

  // Règle métier docs/domain-model.md (Stage) : un vol rattaché à un stage
  // doit avoir une date dans l'intervalle du stage.
  describe("with a trainingCampId", () => {
    it("succeeds when the flight date is within the training camp's interval", async () => {
      const flight = await createFlight(userId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId,
        flightTypeId,
        trainingCampId,
        date: "2025-01-12",
      });
      expect(flight.trainingCampId).toBe(trainingCampId);
    });

    it("fails when the flight date is before the training camp's start date", async () => {
      await expect(
        createFlight(userId, {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
          trainingCampId,
          date: "2025-01-05",
        }),
      ).rejects.toThrow();
    });

    it("fails when the flight date is after the training camp's end date", async () => {
      await expect(
        createFlight(userId, {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
          trainingCampId,
          date: "2025-01-25",
        }),
      ).rejects.toThrow();
    });

    it("fails when the training camp belongs to another user", async () => {
      await expect(
        createFlight(userId, {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
          trainingCampId: otherUserTrainingCampId,
          date: "2025-01-12",
        }),
      ).rejects.toThrow();
    });
  });
});
