import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSitePoint } from "./create-site-point.service";
import { updateSitePoint } from "./update-site-point.service";

let siteId: string;
let otherSiteId: string;
let takeoffTypeId: string;
let landingTypeId: string;
let pointId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const [site, otherSite, takeoffType, landingType] = await Promise.all([
    prisma.site.create({ data: { name: `Update SitePoint Test Site ${suffix}` } }),
    prisma.site.create({ data: { name: `Update SitePoint Test Other Site ${suffix}` } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  siteId = site.id;
  otherSiteId = otherSite.id;
  takeoffTypeId = takeoffType.id;
  landingTypeId = landingType.id;

  const point = await createSitePoint({
    label: "Point initial",
    siteId,
    sitePointTypeId: takeoffTypeId,
    latitude: "45.3",
    longitude: "5.9",
    altitudeM: "900",
    orientationDeg: "90",
  });
  pointId = point.id;
});

afterAll(async () => {
  await prisma.sitePoint.deleteMany({ where: { id: pointId } });
  await prisma.site.deleteMany({ where: { id: { in: [siteId, otherSiteId] } } });
  await prisma.$disconnect();
});

describe("updateSitePoint (integration)", () => {
  it("updates the point, including re-associating it with another site and type", async () => {
    const updated = await updateSitePoint(pointId, {
      label: "Point modifié",
      siteId: otherSiteId,
      sitePointTypeId: landingTypeId,
      latitude: "45.5",
      longitude: "6.1",
      altitudeM: "300",
    });

    expect(updated.label).toBe("Point modifié");
    expect(updated.siteId).toBe(otherSiteId);
    expect(updated.sitePointTypeId).toBe(landingTypeId);
    expect(updated.orientationDeg).toBeNull();
  });

  it("fails when the target site does not exist", async () => {
    await expect(
      updateSitePoint(pointId, {
        label: "Point modifié",
        siteId: crypto.randomUUID(),
        sitePointTypeId: takeoffTypeId,
        latitude: "45.3",
        longitude: "5.9",
        altitudeM: "900",
      }),
    ).rejects.toThrow();
  });

  it("fails with invalid data", async () => {
    await expect(
      updateSitePoint(pointId, {
        label: "",
        siteId,
        sitePointTypeId: takeoffTypeId,
        latitude: "45.3",
        longitude: "5.9",
        altitudeM: "900",
      }),
    ).rejects.toThrow();
  });
});
