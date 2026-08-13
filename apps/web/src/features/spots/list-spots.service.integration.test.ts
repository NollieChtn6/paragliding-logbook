import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createSpot } from "./create-spot.service";
import { getSpot } from "./get-spot.service";
import { listSpots } from "./list-spots.service";

const t = getDictionary("fr-FR").validation.spot;

let spotId: string;
let uniqueName: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  uniqueName = `List Spot Search Test ${suffix}`;
  const spot = await createSpot({ name: uniqueName }, t);
  spotId = spot.id;
});

afterAll(async () => {
  await prisma.spot.deleteMany({ where: { id: spotId } });
  await prisma.$disconnect();
});

describe("listSpots (integration)", () => {
  it("finds a spot by a case-insensitive partial name match", async () => {
    const results = await listSpots(uniqueName.toLowerCase().slice(0, 10));
    expect(results.some((spot) => spot.id === spotId)).toBe(true);
  });

  it("returns no results for a query that matches nothing", async () => {
    const results = await listSpots("this-query-should-not-match-anything-xyz");
    expect(results).toHaveLength(0);
  });

  it("includes the site count", async () => {
    const results = await listSpots(uniqueName);
    expect(results[0]?._count.sites).toBe(0);
  });
});

describe("getSpot (integration)", () => {
  it("returns the spot with its sites", async () => {
    const spot = await getSpot(spotId);
    expect(spot?.id).toBe(spotId);
    expect(spot?.sites).toEqual([]);
  });

  it("returns null when the spot does not exist", async () => {
    const spot = await getSpot(crypto.randomUUID());
    expect(spot).toBeNull();
  });
});
