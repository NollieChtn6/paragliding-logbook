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
let otherSiteId: string;
let takeoffPointId: string;
let landingPointId: string;
let otherSiteTakeoffPointId: string;
let flightTypeId: string;
let trainingCampTypeId: string;
let schoolId: string;
let trainingCampId: string;
let otherUserTrainingCampId: string;
let flightId: string;
let activityId: string;

const validFlightInput = {
  date: "2025-01-15",
  durationMin: "35",
  observations: "Integration test flight.",
  improvementPoints: "Work on approach phases.",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [
    user,
    otherUser,
    site,
    otherSite,
    school,
    takeoffType,
    landingType,
    flightType,
    trainingCampType,
  ] = await Promise.all([
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
    prisma.site.create({ data: { name: `Update Flight Test Other Site ${suffix}` } }),
    prisma.school.create({ data: { name: `Update Flight Test School ${suffix}` } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
    prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
    prisma.trainingCampType.findUniqueOrThrow({ where: { code: "PROGRESSION" } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  siteId = site.id;
  otherSiteId = otherSite.id;
  schoolId = school.id;
  flightTypeId = flightType.id;
  trainingCampTypeId = trainingCampType.id;

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

  const flight = await createFlight(userId, {
    ...validFlightInput,
    takeoffPointId,
    landingPointId,
    flightTypeId,
  });
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
  await prisma.sitePoint.deleteMany({ where: { siteId: { in: [siteId, otherSiteId] } } });
  await prisma.site.deleteMany({ where: { id: { in: [siteId, otherSiteId] } } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("updateFlight (integration)", () => {
  it("updates the Flight with the submitted data", async () => {
    const updated = await updateFlight(userId, activityId, {
      ...validFlightInput,
      takeoffPointId,
      landingPointId,
      flightTypeId,
      durationMin: "50",
      observations: "Updated observations.",
    });

    expect(updated.id).toBe(flightId);
    expect(updated.durationMin).toBe(50);
    expect(updated.observations).toBe("Updated observations.");
  });

  it("accepts a takeoff point and a landing point belonging to two different sites", async () => {
    const updated = await updateFlight(userId, activityId, {
      ...validFlightInput,
      takeoffPointId: otherSiteTakeoffPointId,
      landingPointId,
      flightTypeId,
    });

    expect(updated.takeoffPointId).toBe(otherSiteTakeoffPointId);
    expect(updated.landingPointId).toBe(landingPointId);

    // Remet les points d'origine pour ne pas affecter les tests suivants.
    await updateFlight(userId, activityId, {
      ...validFlightInput,
      takeoffPointId,
      landingPointId,
      flightTypeId,
    });
  });

  it("clears an optional field when it is omitted from the input", async () => {
    await updateFlight(userId, activityId, {
      ...validFlightInput,
      takeoffPointId,
      landingPointId,
      flightTypeId,
      trainingCampId,
      date: "2025-01-12",
    });

    const withCamp = await updateFlight(userId, activityId, {
      ...validFlightInput,
      takeoffPointId,
      landingPointId,
      flightTypeId,
    });

    expect(withCamp.trainingCampId).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(
      updateFlight(userId, activityId, {
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
      updateFlight(userId, activityId, {
        ...validFlightInput,
        takeoffPointId: crypto.randomUUID(),
        landingPointId,
        flightTypeId,
      }),
    ).rejects.toThrow();
  });

  // docs/decisions/005-flight-takeoff-landing-points.md : takeoffPointId
  // doit référencer un point TAKEOFF, landingPointId un point LANDING.
  it("fails when the takeoff point is actually a landing point", async () => {
    await expect(
      updateFlight(userId, activityId, {
        ...validFlightInput,
        takeoffPointId: landingPointId,
        landingPointId,
        flightTypeId,
      }),
    ).rejects.toThrow();
  });

  it("fails when the landing point is actually a takeoff point", async () => {
    await expect(
      updateFlight(userId, activityId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId: takeoffPointId,
        flightTypeId,
      }),
    ).rejects.toThrow();
  });

  it("fails when the flight type does not exist", async () => {
    await expect(
      updateFlight(userId, activityId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId,
        flightTypeId: crypto.randomUUID(),
      }),
    ).rejects.toThrow();
  });

  it("throws ActivityNotFoundError when the activity does not exist", async () => {
    await expect(
      updateFlight(userId, crypto.randomUUID(), {
        ...validFlightInput,
        takeoffPointId,
        landingPointId,
        flightTypeId,
      }),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  it("throws ActivityNotFoundError when the activity belongs to another user", async () => {
    await expect(
      updateFlight(otherUserId, activityId, {
        ...validFlightInput,
        takeoffPointId,
        landingPointId,
        flightTypeId,
      }),
    ).rejects.toThrow(ActivityNotFoundError);
  });

  // Règle métier docs/domain-model.md (Stage), identique à la création.
  describe("with a trainingCampId", () => {
    it("fails when the flight date is outside the training camp's interval", async () => {
      await expect(
        updateFlight(userId, activityId, {
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
        updateFlight(userId, activityId, {
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
