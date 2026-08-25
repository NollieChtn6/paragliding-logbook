import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { EquipmentNotFoundError } from "./equipment-not-found.error";
import { updateEquipment } from "./update-equipment.service";

const t = getDictionary("fr-FR").validation.equipment;

let userId: string;
let otherUserId: string;
let wingTypeId: string;
let harnessTypeId: string;
let equipmentId: string;
let referencedFlightSpotId: string | undefined;

const validEquipmentInput = {
  brand: "Ozone",
  model: "Rush 6",
  purchaseDate: "2025-01-10",
  condition: "NEW",
  status: "ACTIVE",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, wingType, harnessType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-equip-update-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `integration-test-equip-update-other-${suffix}@paragliding-logbook.local`,
        name: "Other Integration Test User",
      },
    }),
    prisma.equipmentType.upsert({
      where: { code: "WING" },
      update: {},
      create: { code: "WING" },
    }),
    prisma.equipmentType.upsert({
      where: { code: "HARNESS" },
      update: {},
      create: { code: "HARNESS" },
    }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  wingTypeId = wingType.id;
  harnessTypeId = harnessType.id;

  const equipment = await prisma.equipment.create({
    data: {
      userId,
      equipmentTypeId: wingTypeId,
      brand: "Ozone",
      model: "Rush 6",
      purchaseDate: new Date("2025-01-10"),
      condition: "NEW",
    },
  });
  equipmentId = equipment.id;
});

afterAll(async () => {
  await prisma.flight.deleteMany({
    where: { activity: { userId: { in: [userId, otherUserId] } } },
  });
  await prisma.activity.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  if (referencedFlightSpotId) {
    await prisma.site.deleteMany({ where: { spotId: referencedFlightSpotId } });
    await prisma.spot.delete({ where: { id: referencedFlightSpotId } });
  }
  await prisma.equipment.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("updateEquipment (integration)", () => {
  it("updates the equipment with the submitted data", async () => {
    const updated = await updateEquipment(
      userId,
      equipmentId,
      { ...validEquipmentInput, equipmentTypeId: harnessTypeId, model: "Rush 6 (renamed)" },
      t,
    );
    expect(updated.equipmentTypeId).toBe(harnessTypeId);
    expect(updated.model).toBe("Rush 6 (renamed)");
  });

  it("changes the status to SOLD", async () => {
    const updated = await updateEquipment(
      userId,
      equipmentId,
      { ...validEquipmentInput, equipmentTypeId: harnessTypeId, status: "SOLD" },
      t,
    );
    expect(updated.status).toBe("SOLD");
  });

  it("throws EquipmentNotFoundError when the equipment does not exist", async () => {
    await expect(
      updateEquipment(
        userId,
        crypto.randomUUID(),
        { ...validEquipmentInput, equipmentTypeId: wingTypeId },
        t,
      ),
    ).rejects.toThrow(EquipmentNotFoundError);
  });

  it("throws EquipmentNotFoundError, and does not update, when the equipment belongs to another user", async () => {
    await expect(
      updateEquipment(
        otherUserId,
        equipmentId,
        { ...validEquipmentInput, equipmentTypeId: wingTypeId, brand: "Tentative non autorisée" },
        t,
      ),
    ).rejects.toThrow(EquipmentNotFoundError);

    const untouched = await prisma.equipment.findUniqueOrThrow({ where: { id: equipmentId } });
    expect(untouched.brand).not.toBe("Tentative non autorisée");
  });

  it("fails when the new equipment type does not exist", async () => {
    await expect(
      updateEquipment(
        userId,
        equipmentId,
        { ...validEquipmentInput, equipmentTypeId: crypto.randomUUID() },
        t,
      ),
    ).rejects.toThrow();
  });

  // Régression : changer la catégorie d'un Equipment déjà référencé par une
  // activité casserait silencieusement l'invariant "wingId pointe vers un
  // Equipment de type WING" sur cette activité (voir
  // update-equipment.service.ts).
  describe("when the equipment is referenced by a Flight", () => {
    let referencedEquipmentId: string;

    beforeAll(async () => {
      const [activityType, flightType, takeoffType, landingType] = await Promise.all([
        prisma.activityType.findUniqueOrThrow({ where: { code: "FLIGHT" } }),
        prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
        prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
        prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
      ]);

      const spot = await prisma.spot.create({
        data: { name: `Integration Test Spot ${crypto.randomUUID()}` },
      });
      referencedFlightSpotId = spot.id;
      const [takeoffPoint, landingPoint] = await Promise.all([
        prisma.site.create({
          data: {
            label: "Takeoff",
            spotId: spot.id,
            siteTypeId: takeoffType.id,
            latitude: 45.9,
            longitude: 6.9,
            altitudeM: 1200,
          },
        }),
        prisma.site.create({
          data: {
            label: "Landing",
            spotId: spot.id,
            siteTypeId: landingType.id,
            latitude: 45.8,
            longitude: 6.8,
            altitudeM: 450,
          },
        }),
      ]);

      const equipment = await prisma.equipment.create({
        data: {
          userId,
          equipmentTypeId: wingTypeId,
          brand: "Gin",
          model: "Explorer",
          purchaseDate: new Date("2025-01-10"),
          condition: "NEW",
        },
      });
      referencedEquipmentId = equipment.id;

      const activity = await prisma.activity.create({
        data: { userId, activityTypeId: activityType.id },
      });
      await prisma.flight.create({
        data: {
          activityId: activity.id,
          takeoffPointId: takeoffPoint.id,
          landingPointId: landingPoint.id,
          flightTypeId: flightType.id,
          wingId: equipment.id,
          date: new Date("2025-01-15"),
          durationMin: 30,
          observations: "RAS",
          improvementPoints: "RAS",
        },
      });
    });

    it("rejects a category change", async () => {
      await expect(
        updateEquipment(
          userId,
          referencedEquipmentId,
          { ...validEquipmentInput, equipmentTypeId: harnessTypeId },
          t,
        ),
      ).rejects.toThrow();

      const untouched = await prisma.equipment.findUniqueOrThrow({
        where: { id: referencedEquipmentId },
      });
      expect(untouched.equipmentTypeId).toBe(wingTypeId);
    });

    it("still allows updating other fields when the category is left unchanged", async () => {
      const updated = await updateEquipment(
        userId,
        referencedEquipmentId,
        { ...validEquipmentInput, equipmentTypeId: wingTypeId, model: "Explorer (renamed)" },
        t,
      );
      expect(updated.model).toBe("Explorer (renamed)");
      expect(updated.equipmentTypeId).toBe(wingTypeId);
    });
  });
});
