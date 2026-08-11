import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { searchSpots } from "./search-spots.service";

let spotId: string;
let otherSpotId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [spot, otherSpot] = await Promise.all([
    prisma.spot.create({ data: { name: `Search Spots Test ${suffix}`, region: "Savoie" } }),
    prisma.spot.create({ data: { name: `Search Spots Other ${suffix}` } }),
  ]);
  spotId = spot.id;
  otherSpotId = otherSpot.id;
});

afterAll(async () => {
  await prisma.spot.deleteMany({ where: { id: { in: [spotId, otherSpotId] } } });
  await prisma.$disconnect();
});

describe("searchSpots (integration)", () => {
  it("finds a spot by name", async () => {
    const results = await searchSpots({ query: "Search Spots Test" });

    expect(results.some((spot) => spot.id === spotId)).toBe(true);
    expect(results.some((spot) => spot.id === otherSpotId)).toBe(false);
  });

  it("is case-insensitive", async () => {
    const results = await searchSpots({ query: "search spots test" });

    expect(results.some((spot) => spot.id === spotId)).toBe(true);
  });

  it("returns the region alongside the name", async () => {
    const results = await searchSpots({ query: "Search Spots Test" });

    const match = results.find((spot) => spot.id === spotId);
    expect(match?.region).toBe("Savoie");
  });
});
