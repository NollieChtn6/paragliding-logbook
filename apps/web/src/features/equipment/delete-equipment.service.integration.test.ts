import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { deleteEquipment } from "./delete-equipment.service";
import { EquipmentNotFoundError } from "./equipment-not-found.error";

const equipmentInUseMessage = "Ce matériel est encore utilisé.";

let userId: string;
let otherUserId: string;
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
    otherUser,
    wingType,
    flightActivityType,
    groundHandlingActivityType,
    flightType,
    takeoffType,
    landingType,
  ] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-equip-delete-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `integration-test-equip-delete-other-${suffix}@paragliding-logbook.local`,
        name: "Other Integration Test User",
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
  otherUserId = otherUser.id;
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
  await prisma.flight.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.groundHandlingSession.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.equipment.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.site.deleteMany({ where: { spotId } });
  await prisma.spot.delete({ where: { id: spotId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

async function createEquipmentFixture() {
  return prisma.equipment.create({
    data: {
      userId,
      equipmentTypeId: wingTypeId,
      brand: "Ozone",
      model: "Rush 6",
      purchaseDate: new Date("2025-01-10"),
      condition: "NEW",
    },
  });
}

describe("deleteEquipment (integration)", () => {
  it("deletes the equipment when it is not referenced by any activity", async () => {
    const equipment = await createEquipmentFixture();

    await deleteEquipment(userId, equipment.id, equipmentInUseMessage);

    const persisted = await prisma.equipment.findUnique({ where: { id: equipment.id } });
    expect(persisted).toBeNull();
  });

  it("throws EquipmentNotFoundError when the equipment does not exist", async () => {
    await expect(
      deleteEquipment(userId, crypto.randomUUID(), equipmentInUseMessage),
    ).rejects.toThrow(EquipmentNotFoundError);
  });

  it("throws EquipmentNotFoundError, and does not delete, when the equipment belongs to another user", async () => {
    const equipment = await createEquipmentFixture();

    await expect(deleteEquipment(otherUserId, equipment.id, equipmentInUseMessage)).rejects.toThrow(
      EquipmentNotFoundError,
    );

    const persisted = await prisma.equipment.findUniqueOrThrow({ where: { id: equipment.id } });
    expect(persisted).not.toBeNull();
  });

  it("throws ReferenceDataInUseError, and does not delete, when a Flight still references the equipment as its wing", async () => {
    const equipment = await createEquipmentFixture();
    const activity = await prisma.activity.create({
      data: { userId, activityTypeId: flightActivityTypeId },
    });
    await prisma.flight.create({
      data: {
        activityId: activity.id,
        takeoffPointId,
        landingPointId,
        flightTypeId,
        wingId: equipment.id,
        date: new Date("2025-01-15"),
        durationMin: 30,
        observations: "RAS",
        improvementPoints: "RAS",
      },
    });

    await expect(deleteEquipment(userId, equipment.id, equipmentInUseMessage)).rejects.toThrow(
      ReferenceDataInUseError,
    );

    const persisted = await prisma.equipment.findUniqueOrThrow({ where: { id: equipment.id } });
    expect(persisted).not.toBeNull();
  });

  it("throws ReferenceDataInUseError when a GroundHandlingSession still references the equipment as its harness", async () => {
    const equipment = await createEquipmentFixture();
    const activity = await prisma.activity.create({
      data: { userId, activityTypeId: groundHandlingActivityTypeId },
    });
    await prisma.groundHandlingSession.create({
      data: {
        activityId: activity.id,
        spotId,
        harnessId: equipment.id,
        date: new Date("2025-01-15"),
        durationMin: 20,
        exercises: "Contrôle au sol",
      },
    });

    await expect(deleteEquipment(userId, equipment.id, equipmentInUseMessage)).rejects.toThrow(
      ReferenceDataInUseError,
    );
  });
});
