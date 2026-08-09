import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { createSitePoint } from "./create-site-point.service";
import { deleteSitePoint } from "./delete-site-point.service";

let siteId: string;
let takeoffTypeId: string;
let landingTypeId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const [site, takeoffType, landingType] = await Promise.all([
    prisma.site.create({ data: { name: `Delete SitePoint Test Site ${suffix}` } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  siteId = site.id;
  takeoffTypeId = takeoffType.id;
  landingTypeId = landingType.id;
});

afterAll(async () => {
  await prisma.site.deleteMany({ where: { id: siteId } });
  await prisma.$disconnect();
});

describe("deleteSitePoint (integration)", () => {
  it("deletes a point with no associated flights", async () => {
    const point = await createSitePoint({
      label: "Point sans vol",
      siteId,
      sitePointTypeId: takeoffTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "900",
    });

    await deleteSitePoint(point.id);

    const found = await prisma.sitePoint.findUnique({ where: { id: point.id } });
    expect(found).toBeNull();
  });

  it("refuses to delete a point referenced by a flight as takeoff", async () => {
    const takeoffPoint = await createSitePoint({
      label: "Décollage utilisé",
      siteId,
      sitePointTypeId: takeoffTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "900",
    });
    const landingPoint = await createSitePoint({
      label: "Atterrissage utilisé",
      siteId,
      sitePointTypeId: landingTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "300",
    });

    const suffix = crypto.randomUUID();
    const user = await prisma.user.create({
      data: { email: `delete-site-point-${suffix}@paragliding-logbook.local`, name: "Test User" },
    });
    const activityType = await prisma.activityType.findUniqueOrThrow({
      where: { code: "FLIGHT" },
    });
    const flightType = await prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } });
    const activity = await prisma.activity.create({
      data: { userId: user.id, activityTypeId: activityType.id },
    });
    await prisma.flight.create({
      data: {
        activityId: activity.id,
        takeoffPointId: takeoffPoint.id,
        landingPointId: landingPoint.id,
        flightTypeId: flightType.id,
        date: new Date("2025-06-01"),
        durationMin: 30,
        observations: "RAS",
        improvementPoints: "RAS",
      },
    });

    await expect(deleteSitePoint(takeoffPoint.id)).rejects.toThrow(ReferenceDataInUseError);
    await expect(deleteSitePoint(landingPoint.id)).rejects.toThrow(ReferenceDataInUseError);

    await prisma.flight.deleteMany({ where: { activityId: activity.id } });
    await prisma.activity.deleteMany({ where: { id: activity.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.sitePoint.deleteMany({
      where: { id: { in: [takeoffPoint.id, landingPoint.id] } },
    });
  });
});
