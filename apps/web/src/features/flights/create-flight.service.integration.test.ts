import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createFlight } from "./create-flight.service";

const t = getDictionary("fr-FR").validation.flight;
const trainingCampMessages = getDictionary("fr-FR").validation.trainingCamp;

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let otherUserId: string;
let spotId: string;
let otherSpotId: string;
let takeoffPointId: string;
let landingPointId: string;
let otherSpotTakeoffPointId: string;
let flightTypeId: string;
let trainingCampTypeId: string;
let schoolId: string;
let trainingCampId: string;
let otherUserTrainingCampId: string;
let wingId: string;
let harnessId: string;
let otherUserWingId: string;

const validFlightInput = {
  date: "2025-01-15",
  time: "14:30",
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
      prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
      prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
      prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
      prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
    ]);
  userId = user.id;
  otherUserId = otherUser.id;
  flightTypeId = flightType.id;
  trainingCampTypeId = trainingCampType.id;

  const [spot, otherSpot] = await Promise.all([
    prisma.spot.create({ data: { name: `Integration Test Spot ${suffix}` } }),
    prisma.spot.create({ data: { name: `Integration Test Other Spot ${suffix}` } }),
  ]);
  spotId = spot.id;
  otherSpotId = otherSpot.id;

  const [takeoffPoint, landingPoint, otherSpotTakeoffPoint] = await Promise.all([
    prisma.site.create({
      data: {
        label: "Takeoff",
        spotId,
        siteTypeId: takeoffType.id,
        latitude: 45.9,
        longitude: 6.9,
        altitudeM: 1200,
      },
    }),
    prisma.site.create({
      data: {
        label: "Landing",
        spotId,
        siteTypeId: landingType.id,
        latitude: 45.8,
        longitude: 6.8,
        altitudeM: 450,
      },
    }),
    prisma.site.create({
      data: {
        label: "Other Spot Takeoff",
        spotId: otherSpotId,
        siteTypeId: takeoffType.id,
        latitude: 46.0,
        longitude: 7.0,
        altitudeM: 1800,
      },
    }),
  ]);
  takeoffPointId = takeoffPoint.id;
  landingPointId = landingPoint.id;
  otherSpotTakeoffPointId = otherSpotTakeoffPoint.id;

  const school = await prisma.school.create({
    data: { name: `Integration Test School ${suffix}` },
  });
  schoolId = school.id;

  const [wingType, harnessType] = await Promise.all([
    prisma.equipmentType.upsert({ where: { code: "WING" }, update: {}, create: { code: "WING" } }),
    prisma.equipmentType.upsert({
      where: { code: "HARNESS" },
      update: {},
      create: { code: "HARNESS" },
    }),
  ]);
  const [wing, harness, otherUserWing] = await Promise.all([
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
        userId,
        equipmentTypeId: harnessType.id,
        brand: "Woody Valley",
        model: "Wani Light 2",
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
  harnessId = harness.id;
  otherUserWingId = otherUserWing.id;

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
  await prisma.flight.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.trainingCamp.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.site.deleteMany({ where: { spotId: { in: [spotId, otherSpotId] } } });
  await prisma.spot.deleteMany({ where: { id: { in: [spotId, otherSpotId] } } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.equipment.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("createFlight (integration)", () => {
  describe("with valid data", () => {
    let flightId: string;
    let activityId: string;

    beforeAll(async () => {
      const flight = await createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
        },
        t,
      );
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

  it("accepts a takeoff point and a landing point belonging to two different spots", async () => {
    const flight = await createFlight(
      userId,
      {
        ...validFlightInput,
        takeoffPointId: otherSpotTakeoffPointId,
        landingPointId,
        flightTypeId,
      },
      t,
    );
    expect(flight.takeoffPointId).toBe(otherSpotTakeoffPointId);
    expect(flight.landingPointId).toBe(landingPointId);
  });

  it("accepts a wing and a harness belonging to the current user, with the right equipment type", async () => {
    const flight = await createFlight(
      userId,
      { ...validFlightInput, takeoffPointId, landingPointId, flightTypeId, wingId, harnessId },
      t,
    );
    expect(flight.wingId).toBe(wingId);
    expect(flight.harnessId).toBe(harnessId);
  });

  it("fails when the wing does not exist", async () => {
    await expect(
      createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
          wingId: crypto.randomUUID(),
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the wing belongs to another user", async () => {
    await expect(
      createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
          wingId: otherUserWingId,
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the wing field references equipment of the wrong type", async () => {
    await expect(
      createFlight(
        userId,
        { ...validFlightInput, takeoffPointId, landingPointId, flightTypeId, wingId: harnessId },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails with invalid data", async () => {
    await expect(
      createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
          durationMin: "-10",
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the takeoff point does not exist", async () => {
    await expect(
      createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId: crypto.randomUUID(),
          landingPointId,
          flightTypeId,
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the landing point does not exist", async () => {
    await expect(
      createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId: crypto.randomUUID(),
          flightTypeId,
        },
        t,
      ),
    ).rejects.toThrow();
  });

  // docs/decisions/005-flight-takeoff-landing-points.md : takeoffPointId
  // doit référencer un point TAKEOFF, landingPointId un point LANDING — non
  // exprimable par la seule FK SQL, vérifié dans le service.
  it("fails when the takeoff point is actually a landing point", async () => {
    await expect(
      createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId: landingPointId,
          landingPointId,
          flightTypeId,
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the landing point is actually a takeoff point", async () => {
    await expect(
      createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId: takeoffPointId,
          flightTypeId,
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the flight type does not exist", async () => {
    await expect(
      createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId: crypto.randomUUID(),
        },
        t,
      ),
    ).rejects.toThrow();
  });

  // Règle métier docs/domain-model.md (Stage) : un vol rattaché à un stage
  // doit avoir une date dans l'intervalle du stage.
  describe("with a trainingCampId", () => {
    it("succeeds when the flight date is within the training camp's interval", async () => {
      const flight = await createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
          trainingCampId,
          date: "2025-01-12",
        },
        t,
      );
      expect(flight.trainingCampId).toBe(trainingCampId);
    });

    // Régression : startDate/endDate n'ont pas d'heure (minuit), alors que
    // date en a désormais une (voir lib/validations/flight.ts) — comparer
    // les instants complets rejetterait à tort un vol en soirée le dernier
    // jour du stage, son heure dépassant le minuit d'endDate. La comparaison
    // doit se faire au jour près (voir create-flight.service.ts).
    it("succeeds for a late-evening flight on the training camp's exact end date", async () => {
      const flight = await createFlight(
        userId,
        {
          ...validFlightInput,
          takeoffPointId,
          landingPointId,
          flightTypeId,
          trainingCampId,
          date: "2025-01-20",
          time: "22:30",
        },
        t,
      );
      expect(flight.trainingCampId).toBe(trainingCampId);
    });

    it("fails when the flight date is before the training camp's start date", async () => {
      await expect(
        createFlight(
          userId,
          {
            ...validFlightInput,
            takeoffPointId,
            landingPointId,
            flightTypeId,
            trainingCampId,
            date: "2025-01-05",
          },
          t,
        ),
      ).rejects.toThrow();
    });

    it("fails when the flight date is after the training camp's end date", async () => {
      await expect(
        createFlight(
          userId,
          {
            ...validFlightInput,
            takeoffPointId,
            landingPointId,
            flightTypeId,
            trainingCampId,
            date: "2025-01-25",
          },
          t,
        ),
      ).rejects.toThrow();
    });

    it("fails when the training camp belongs to another user", async () => {
      await expect(
        createFlight(
          userId,
          {
            ...validFlightInput,
            takeoffPointId,
            landingPointId,
            flightTypeId,
            trainingCampId: otherUserTrainingCampId,
            date: "2025-01-12",
          },
          t,
        ),
      ).rejects.toThrow();
    });
  });
});
