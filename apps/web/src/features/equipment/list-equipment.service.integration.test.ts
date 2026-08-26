import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listEquipment } from "./list-equipment.service";

let userId: string;
let otherUserId: string;
let wingTypeId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, wingType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `integration-test-equip-list-${suffix}@paragliding-logbook.local`,
        name: "Integration Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `integration-test-equip-list-other-${suffix}@paragliding-logbook.local`,
        name: "Other Integration Test User",
      },
    }),
    prisma.equipmentType.upsert({
      where: { code: "WING" },
      update: {},
      create: { code: "WING" },
    }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  wingTypeId = wingType.id;

  await prisma.equipment.createMany({
    data: [
      {
        userId,
        equipmentTypeId: wingTypeId,
        brand: "Ozone",
        model: "Rush 6",
        purchaseDate: new Date("2024-06-01"),
        condition: "NEW",
      },
      {
        userId,
        equipmentTypeId: wingTypeId,
        brand: "Gin",
        model: "Explorer",
        purchaseDate: new Date("2025-01-10"),
        condition: "USED",
        initialUsageMin: 300,
      },
      {
        userId: otherUserId,
        equipmentTypeId: wingTypeId,
        brand: "Advance",
        model: "Iota",
        purchaseDate: new Date("2025-03-01"),
        condition: "NEW",
      },
    ],
  });
});

afterAll(async () => {
  await prisma.equipment.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("listEquipment (integration)", () => {
  it("only returns equipment belonging to the given user, with its equipment type included", async () => {
    const equipment = await listEquipment(userId);

    expect(equipment).toHaveLength(2);
    expect(equipment.every((item) => item.userId === userId)).toBe(true);
    expect(equipment.every((item) => item.equipmentType.code === "WING")).toBe(true);
  });
});
