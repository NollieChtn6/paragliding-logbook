import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSpot } from "./create-spot.service";

const createdIds: string[] = [];

afterEach(async () => {
  await prisma.spot.deleteMany({ where: { id: { in: createdIds } } });
  createdIds.length = 0;
});

describe("createSpot (integration)", () => {
  it("creates a spot with the submitted data", async () => {
    const suffix = crypto.randomUUID();
    const spot = await createSpot({
      name: `Integration Test Spot ${suffix}`,
      region: "Auvergne-Rhône-Alpes",
      countryCode: "fr",
      latitude: "45.3",
      longitude: "5.9",
    });
    createdIds.push(spot.id);

    expect(spot.name).toBe(`Integration Test Spot ${suffix}`);
    expect(spot.region).toBe("Auvergne-Rhône-Alpes");
    expect(spot.countryCode).toBe("FR");
    expect(spot.latitude).toBe(45.3);
    expect(spot.longitude).toBe(5.9);
  });

  it("creates a spot with only a name", async () => {
    const suffix = crypto.randomUUID();
    const spot = await createSpot({ name: `Integration Test Spot ${suffix}` });
    createdIds.push(spot.id);

    expect(spot.region).toBeNull();
    expect(spot.countryCode).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(createSpot({ name: "" })).rejects.toThrow();
  });
});
