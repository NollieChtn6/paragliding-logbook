import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSite } from "./create-site.service";
import { getSite } from "./get-site.service";
import { listSites } from "./list-sites.service";

let spotId: string;
let otherSpotId: string;
let takeoffSiteId: string;
let landingSiteId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const [spot, otherSpot, takeoffType, landingType] = await Promise.all([
    prisma.spot.create({ data: { name: `List Sites Test Spot ${suffix}` } }),
    prisma.spot.create({ data: { name: `List Sites Test Other Spot ${suffix}` } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  spotId = spot.id;
  otherSpotId = otherSpot.id;

  const [takeoff, landing] = await Promise.all([
    createSite({
      label: `Unique Takeoff ${suffix}`,
      spotId,
      siteTypeId: takeoffType.id,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "900",
    }),
    createSite({
      label: `Unique Landing ${suffix}`,
      spotId: otherSpotId,
      siteTypeId: landingType.id,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "300",
    }),
  ]);
  takeoffSiteId = takeoff.id;
  landingSiteId = landing.id;
});

afterAll(async () => {
  await prisma.site.deleteMany({ where: { id: { in: [takeoffSiteId, landingSiteId] } } });
  await prisma.spot.deleteMany({ where: { id: { in: [spotId, otherSpotId] } } });
  await prisma.$disconnect();
});

describe("listSites (integration)", () => {
  it("filters by spot", async () => {
    const results = await listSites({ spotId });
    expect(results.some((site) => site.id === takeoffSiteId)).toBe(true);
    expect(results.some((site) => site.id === landingSiteId)).toBe(false);
  });

  it("filters by type", async () => {
    const results = await listSites({ typeCode: "LANDING" });
    expect(results.some((site) => site.id === landingSiteId)).toBe(true);
    expect(results.some((site) => site.id === takeoffSiteId)).toBe(false);
  });

  it("filters by a search query", async () => {
    const results = await listSites({ query: "Unique Takeoff" });
    expect(results.map((site) => site.id)).toEqual([takeoffSiteId]);
  });
});

describe("getSite (integration)", () => {
  it("returns the site with its spot and type", async () => {
    const site = await getSite(takeoffSiteId);
    expect(site?.spot.id).toBe(spotId);
    expect(site?.siteType.code).toBe("TAKEOFF");
  });

  it("returns null when the site does not exist", async () => {
    const site = await getSite(crypto.randomUUID());
    expect(site).toBeNull();
  });
});
