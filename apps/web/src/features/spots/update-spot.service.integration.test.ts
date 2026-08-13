import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createSpot } from "./create-spot.service";
import { updateSpot } from "./update-spot.service";

const t = getDictionary("fr-FR").validation.spot;

let spotId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const spot = await createSpot({ name: `Update Spot Test ${suffix}`, countryCode: "FR" }, t);
  spotId = spot.id;
});

afterAll(async () => {
  await prisma.spot.deleteMany({ where: { id: spotId } });
  await prisma.$disconnect();
});

describe("updateSpot (integration)", () => {
  it("updates the spot with the submitted data", async () => {
    const updated = await updateSpot(
      spotId,
      {
        name: "Updated Spot Name",
        region: "Nouvelle région",
        countryCode: "CH",
      },
      t,
    );

    expect(updated.name).toBe("Updated Spot Name");
    expect(updated.region).toBe("Nouvelle région");
    expect(updated.countryCode).toBe("CH");
  });

  it("clears an optional field when it is omitted from the input", async () => {
    const updated = await updateSpot(spotId, { name: "Updated Spot Name" }, t);

    expect(updated.region).toBeNull();
    expect(updated.countryCode).toBeNull();
  });

  it("fails with invalid data", async () => {
    await expect(updateSpot(spotId, { name: "" }, t)).rejects.toThrow();
  });

  it("fails when the spot does not exist", async () => {
    await expect(updateSpot(crypto.randomUUID(), { name: "Anything" }, t)).rejects.toThrow();
  });
});
