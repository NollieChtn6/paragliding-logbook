import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getEquipmentUsageMinutes } from "./get-equipment-usage.service";

let userId: string;
let wingTypeId: string;
let flightActivityTypeId: string;
let groundHandlingActivityTypeId: string;
let flightTypeId: string;
let spotId: string;
let takeoffPointId: string;
let landingPointId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [
    user,
    wingType,
    flightActivityType,
    groundHandlingActivityType,
    flightType,
    takeoffType,
    landingType,
  ] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-equip-usage-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.equipmentType.upsert({
      where: { code: "WING" },
      update: {},
      create: { code: "WING" },
    }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "FLIGHT" } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "GROUND_HANDLING" } }),
    prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  userId = user.id;
  wingTypeId = wingType.id;
  flightActivityTypeId = flightActivityType.id;
  groundHandlingActivityTypeId = groundHandlingActivityType.id;
  flightTypeId = flightType.id;

  const spot = await prisma.spot.create({ data: { name: `Integration Test Spot ${suffix}` } });
  spotId = spot.id;

  const [takeoffPoint, landingPoint] = await Promise.all([
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
  ]);
  takeoffPointId = takeoffPoint.id;
  landingPointId = landingPoint.id;
});

afterAll(async () => {
  await prisma.flight.deleteMany({ where: { activity: { userId } } });
  await prisma.groundHandlingSession.deleteMany({ where: { activity: { userId } } });
  await prisma.activity.deleteMany({ where: { userId } });
  await prisma.equipment.deleteMany({ where: { userId } });
  await prisma.site.deleteMany({ where: { spotId } });
  await prisma.spot.delete({ where: { id: spotId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("getEquipmentUsageMinutes (integration)", () => {
  it("returns initialUsageMin alone when no activity references the equipment", async () => {
    const equipment = await prisma.equipment.create({
      data: {
        userId,
        equipmentTypeId: wingTypeId,
        brand: "Ozone",
        model: "Rush 6",
        purchaseDate: new Date("2025-01-10"),
        condition: "USED",
        initialUsageMin: 120,
      },
    });

    const usage = await getEquipmentUsageMinutes(equipment);
    expect(usage).toBe(120);
  });

  it("sums initialUsageMin with linked Flight and GroundHandlingSession durations, ignoring unrelated activities", async () => {
    const equipment = await prisma.equipment.create({
      data: {
        userId,
        equipmentTypeId: wingTypeId,
        brand: "Gin",
        model: "Explorer",
        purchaseDate: new Date("2025-01-10"),
        condition: "USED",
        initialUsageMin: 60,
      },
    });
    const otherEquipment = await prisma.equipment.create({
      data: {
        userId,
        equipmentTypeId: wingTypeId,
        brand: "Advance",
        model: "Iota",
        purchaseDate: new Date("2025-01-10"),
        condition: "NEW",
      },
    });

    const flightActivity = await prisma.activity.create({
      data: { userId, activityTypeId: flightActivityTypeId },
    });
    await prisma.flight.create({
      data: {
        activityId: flightActivity.id,
        takeoffPointId,
        landingPointId,
        flightTypeId,
        wingId: equipment.id,
        date: new Date("2025-01-15"),
        durationMin: 45,
        observations: "RAS",
        improvementPoints: "RAS",
      },
    });

    const groundHandlingActivity = await prisma.activity.create({
      data: { userId, activityTypeId: groundHandlingActivityTypeId },
    });
    await prisma.groundHandlingSession.create({
      data: {
        activityId: groundHandlingActivity.id,
        spotId,
        wingId: equipment.id,
        date: new Date("2025-01-16"),
        durationMin: 20,
        exercises: "Contrôle au sol",
      },
    });

    // Vol lié à un autre équipement : ne doit pas être compté ici.
    const unrelatedActivity = await prisma.activity.create({
      data: { userId, activityTypeId: flightActivityTypeId },
    });
    await prisma.flight.create({
      data: {
        activityId: unrelatedActivity.id,
        takeoffPointId,
        landingPointId,
        flightTypeId,
        wingId: otherEquipment.id,
        date: new Date("2025-01-17"),
        durationMin: 999,
        observations: "RAS",
        improvementPoints: "RAS",
      },
    });

    const usage = await getEquipmentUsageMinutes(equipment);
    expect(usage).toBe(60 + 45 + 20);
  });
});
