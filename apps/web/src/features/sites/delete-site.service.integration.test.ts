import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { createSite } from "./create-site.service";
import { deleteSite } from "./delete-site.service";

let spotId: string;
let takeoffTypeId: string;
let landingTypeId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const [spot, takeoffType, landingType] = await Promise.all([
    prisma.spot.create({ data: { name: `Delete Site Test Spot ${suffix}` } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  spotId = spot.id;
  takeoffTypeId = takeoffType.id;
  landingTypeId = landingType.id;
});

afterAll(async () => {
  await prisma.spot.deleteMany({ where: { id: spotId } });
  await prisma.$disconnect();
});

describe("deleteSite (integration)", () => {
  it("deletes a site with no associated flights", async () => {
    const site = await createSite({
      label: "Site sans vol",
      spotId,
      siteTypeId: takeoffTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "900",
    });

    await deleteSite(site.id);

    const found = await prisma.site.findUnique({ where: { id: site.id } });
    expect(found).toBeNull();
  });

  it("refuses to delete a site referenced by a flight as takeoff", async () => {
    const takeoffSite = await createSite({
      label: "Décollage utilisé",
      spotId,
      siteTypeId: takeoffTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "900",
    });
    const landingSite = await createSite({
      label: "Atterrissage utilisé",
      spotId,
      siteTypeId: landingTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "300",
    });

    const suffix = crypto.randomUUID();
    const user = await prisma.user.create({
      data: { email: `delete-site-${suffix}@paragliding-logbook.local`, name: "Test User" },
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
        takeoffPointId: takeoffSite.id,
        landingPointId: landingSite.id,
        flightTypeId: flightType.id,
        date: new Date("2025-06-01"),
        durationMin: 30,
        observations: "RAS",
        improvementPoints: "RAS",
      },
    });

    await expect(deleteSite(takeoffSite.id)).rejects.toThrow(ReferenceDataInUseError);
    await expect(deleteSite(landingSite.id)).rejects.toThrow(ReferenceDataInUseError);

    await prisma.flight.deleteMany({ where: { activityId: activity.id } });
    await prisma.activity.deleteMany({ where: { id: activity.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.site.deleteMany({
      where: { id: { in: [takeoffSite.id, landingSite.id] } },
    });
  });
});
