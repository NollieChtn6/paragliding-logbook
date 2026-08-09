import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { searchSitePoints } from "./search-site-points.service";

let siteId: string;
let otherSiteId: string;
let takeoffPointId: string;
let landingPointId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [takeoffType, landingType] = await Promise.all([
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);

  const [site, otherSite] = await Promise.all([
    prisma.site.create({ data: { name: `Search Test Site ${suffix}` } }),
    prisma.site.create({ data: { name: `Search Test Other Site ${suffix}` } }),
  ]);
  siteId = site.id;
  otherSiteId = otherSite.id;

  const [takeoffPoint, landingPoint] = await Promise.all([
    prisma.sitePoint.create({
      data: {
        label: `Search Test Takeoff ${suffix}`,
        siteId,
        sitePointTypeId: takeoffType.id,
        latitude: 45.9,
        longitude: 6.9,
        altitudeM: 1200,
      },
    }),
    prisma.sitePoint.create({
      data: {
        label: `Search Test Landing ${suffix}`,
        siteId: otherSiteId,
        sitePointTypeId: landingType.id,
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
  await prisma.sitePoint.deleteMany({ where: { siteId: { in: [siteId, otherSiteId] } } });
  await prisma.site.deleteMany({ where: { id: { in: [siteId, otherSiteId] } } });
  await prisma.$disconnect();
});

describe("searchSitePoints (integration)", () => {
  it("finds a takeoff point by name", async () => {
    const results = await searchSitePoints({ query: "Search Test Takeoff", type: "TAKEOFF" });

    expect(results.some((point) => point.id === takeoffPointId)).toBe(true);
  });

  it("finds a landing point by name", async () => {
    const results = await searchSitePoints({ query: "Search Test Landing", type: "LANDING" });

    expect(results.some((point) => point.id === landingPointId)).toBe(true);
  });

  it("filters by type: a takeoff point does not show up in a landing search", async () => {
    const results = await searchSitePoints({ query: "Search Test Takeoff", type: "LANDING" });

    expect(results.some((point) => point.id === takeoffPointId)).toBe(false);
  });

  it("includes the parent site in each result", async () => {
    const results = await searchSitePoints({ query: "Search Test Takeoff", type: "TAKEOFF" });

    const match = results.find((point) => point.id === takeoffPointId);
    expect(match?.site.id).toBe(siteId);
  });
});
