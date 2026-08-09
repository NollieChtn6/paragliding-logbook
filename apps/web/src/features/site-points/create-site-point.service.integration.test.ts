import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSitePoint } from "./create-site-point.service";

let siteId: string;
let takeoffTypeId: string;
let landingTypeId: string;
const createdPointIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const [site, takeoffType, landingType] = await Promise.all([
    prisma.site.create({ data: { name: `Create SitePoint Test Site ${suffix}` } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  siteId = site.id;
  takeoffTypeId = takeoffType.id;
  landingTypeId = landingType.id;
});

afterAll(async () => {
  await prisma.sitePoint.deleteMany({ where: { id: { in: createdPointIds } } });
  await prisma.site.deleteMany({ where: { id: siteId } });
  await prisma.$disconnect();
});

describe("createSitePoint (integration)", () => {
  it("creates a takeoff point associated with the site", async () => {
    const point = await createSitePoint({
      label: "Décollage test",
      siteId,
      sitePointTypeId: takeoffTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "900",
      orientationDeg: "90",
    });
    createdPointIds.push(point.id);

    expect(point.siteId).toBe(siteId);
    expect(point.sitePointTypeId).toBe(takeoffTypeId);
    expect(point.altitudeM).toBe(900);
    expect(point.orientationDeg).toBe(90);
  });

  it("creates a landing point without an orientation", async () => {
    const point = await createSitePoint({
      label: "Atterrissage test",
      siteId,
      sitePointTypeId: landingTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "300",
    });
    createdPointIds.push(point.id);

    expect(point.sitePointTypeId).toBe(landingTypeId);
    expect(point.orientationDeg).toBeNull();
  });

  it("fails when the site does not exist", async () => {
    await expect(
      createSitePoint({
        label: "Point orphelin",
        siteId: crypto.randomUUID(),
        sitePointTypeId: takeoffTypeId,
        latitude: "45.3",
        longitude: "5.9",
        altitudeM: "900",
      }),
    ).rejects.toThrow();
  });

  it("fails when the site point type does not exist", async () => {
    await expect(
      createSitePoint({
        label: "Point orphelin",
        siteId,
        sitePointTypeId: crypto.randomUUID(),
        latitude: "45.3",
        longitude: "5.9",
        altitudeM: "900",
      }),
    ).rejects.toThrow();
  });

  it("fails with invalid coordinates", async () => {
    await expect(
      createSitePoint({
        label: "Point invalide",
        siteId,
        sitePointTypeId: takeoffTypeId,
        latitude: "200",
        longitude: "5.9",
        altitudeM: "900",
      }),
    ).rejects.toThrow();
  });
});
