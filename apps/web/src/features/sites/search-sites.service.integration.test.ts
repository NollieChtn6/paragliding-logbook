import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { searchSites } from "./search-sites.service";

const t = getDictionary("fr-FR").validation.siteSearch;

let spotId: string;
let otherSpotId: string;
let takeoffSiteId: string;
let landingSiteId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [takeoffType, landingType] = await Promise.all([
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);

  const [spot, otherSpot] = await Promise.all([
    prisma.spot.create({ data: { name: `Search Test Spot ${suffix}` } }),
    prisma.spot.create({ data: { name: `Search Test Other Spot ${suffix}` } }),
  ]);
  spotId = spot.id;
  otherSpotId = otherSpot.id;

  const [takeoffSite, landingSite] = await Promise.all([
    prisma.site.create({
      data: {
        label: `Search Test Takeoff ${suffix}`,
        spotId,
        siteTypeId: takeoffType.id,
        latitude: 45.9,
        longitude: 6.9,
        altitudeM: 1200,
      },
    }),
    prisma.site.create({
      data: {
        label: `Search Test Landing ${suffix}`,
        spotId: otherSpotId,
        siteTypeId: landingType.id,
        latitude: 45.8,
        longitude: 6.8,
        altitudeM: 450,
      },
    }),
  ]);
  takeoffSiteId = takeoffSite.id;
  landingSiteId = landingSite.id;
});

afterAll(async () => {
  await prisma.site.deleteMany({ where: { spotId: { in: [spotId, otherSpotId] } } });
  await prisma.spot.deleteMany({ where: { id: { in: [spotId, otherSpotId] } } });
  await prisma.$disconnect();
});

describe("searchSites (integration)", () => {
  it("finds a takeoff site by name", async () => {
    const results = await searchSites({ query: "Search Test Takeoff", type: "TAKEOFF" }, t);

    expect(results.some((site) => site.id === takeoffSiteId)).toBe(true);
  });

  it("finds a landing site by name", async () => {
    const results = await searchSites({ query: "Search Test Landing", type: "LANDING" }, t);

    expect(results.some((site) => site.id === landingSiteId)).toBe(true);
  });

  it("filters by type: a takeoff site does not show up in a landing search", async () => {
    const results = await searchSites({ query: "Search Test Takeoff", type: "LANDING" }, t);

    expect(results.some((site) => site.id === takeoffSiteId)).toBe(false);
  });

  it("includes the parent spot in each result", async () => {
    const results = await searchSites({ query: "Search Test Takeoff", type: "TAKEOFF" }, t);

    const match = results.find((site) => site.id === takeoffSiteId);
    expect(match?.spot.id).toBe(spotId);
  });
});
