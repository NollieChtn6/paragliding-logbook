import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createEquipment } from "./create-equipment.service";

const t = getDictionary("fr-FR").validation.equipment;

let userId: string;
let wingTypeId: string;

const validEquipmentInput = {
  brand: "Ozone",
  model: "Rush 6",
  purchaseDate: "2025-01-10",
  condition: "NEW",
};

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, wingType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-equip-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.equipmentType.upsert({
      where: { code: "WING" },
      update: {},
      create: { code: "WING" },
    }),
  ]);
  userId = user.id;
  wingTypeId = wingType.id;
});

afterAll(async () => {
  await prisma.equipment.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("createEquipment (integration)", () => {
  it("creates the Equipment with the submitted data, linked to the right user, defaulting to ACTIVE", async () => {
    const equipment = await createEquipment(
      userId,
      { ...validEquipmentInput, equipmentTypeId: wingTypeId },
      t,
    );

    const persisted = await prisma.equipment.findUniqueOrThrow({ where: { id: equipment.id } });
    expect(persisted.userId).toBe(userId);
    expect(persisted.equipmentTypeId).toBe(wingTypeId);
    expect(persisted.brand).toBe("Ozone");
    expect(persisted.model).toBe("Rush 6");
    expect(persisted.condition).toBe("NEW");
    expect(persisted.initialUsageMin).toBe(0);
    expect(persisted.status).toBe("ACTIVE");
  });

  it("creates a used equipment with an initial usage volume", async () => {
    const equipment = await createEquipment(
      userId,
      {
        ...validEquipmentInput,
        equipmentTypeId: wingTypeId,
        condition: "USED",
        initialUsageMin: 600,
      },
      t,
    );
    expect(equipment.initialUsageMin).toBe(600);
  });

  it("fails with invalid data", async () => {
    await expect(
      createEquipment(
        userId,
        { ...validEquipmentInput, equipmentTypeId: wingTypeId, brand: "" },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails when the equipment type does not exist", async () => {
    await expect(
      createEquipment(userId, { ...validEquipmentInput, equipmentTypeId: crypto.randomUUID() }, t),
    ).rejects.toThrow();
  });
});
