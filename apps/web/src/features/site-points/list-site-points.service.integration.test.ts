import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSitePoint } from "./create-site-point.service";
import { getSitePoint } from "./get-site-point.service";
import { listSitePoints } from "./list-site-points.service";

let siteId: string;
let otherSiteId: string;
let takeoffPointId: string;
let landingPointId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const [site, otherSite, takeoffType, landingType] = await Promise.all([
    prisma.site.create({ data: { name: `List SitePoints Test Site ${suffix}` } }),
    prisma.site.create({ data: { name: `List SitePoints Test Other Site ${suffix}` } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  siteId = site.id;
  otherSiteId = otherSite.id;

  const [takeoff, landing] = await Promise.all([
    createSitePoint({
      label: `Unique Takeoff ${suffix}`,
      siteId,
      sitePointTypeId: takeoffType.id,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "900",
    }),
    createSitePoint({
      label: `Unique Landing ${suffix}`,
      siteId: otherSiteId,
      sitePointTypeId: landingType.id,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "300",
    }),
  ]);
  takeoffPointId = takeoff.id;
  landingPointId = landing.id;
});

afterAll(async () => {
  await prisma.sitePoint.deleteMany({ where: { id: { in: [takeoffPointId, landingPointId] } } });
  await prisma.site.deleteMany({ where: { id: { in: [siteId, otherSiteId] } } });
  await prisma.$disconnect();
});

describe("listSitePoints (integration)", () => {
  it("filters by site", async () => {
    const results = await listSitePoints({ siteId });
    expect(results.some((point) => point.id === takeoffPointId)).toBe(true);
    expect(results.some((point) => point.id === landingPointId)).toBe(false);
  });

  it("filters by type", async () => {
    const results = await listSitePoints({ typeCode: "LANDING" });
    expect(results.some((point) => point.id === landingPointId)).toBe(true);
    expect(results.some((point) => point.id === takeoffPointId)).toBe(false);
  });

  it("filters by a search query", async () => {
    const results = await listSitePoints({ query: "Unique Takeoff" });
    expect(results.map((point) => point.id)).toEqual([takeoffPointId]);
  });
});

describe("getSitePoint (integration)", () => {
  it("returns the point with its site and type", async () => {
    const point = await getSitePoint(takeoffPointId);
    expect(point?.site.id).toBe(siteId);
    expect(point?.sitePointType.code).toBe("TAKEOFF");
  });

  it("returns null when the point does not exist", async () => {
    const point = await getSitePoint(crypto.randomUUID());
    expect(point).toBeNull();
  });
});
