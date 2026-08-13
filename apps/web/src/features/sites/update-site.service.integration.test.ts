import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createSite } from "./create-site.service";
import { updateSite } from "./update-site.service";

const t = getDictionary("fr-FR").validation.site;

let spotId: string;
let otherSpotId: string;
let takeoffTypeId: string;
let landingTypeId: string;
let siteId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const [spot, otherSpot, takeoffType, landingType] = await Promise.all([
    prisma.spot.create({ data: { name: `Update Site Test Spot ${suffix}` } }),
    prisma.spot.create({ data: { name: `Update Site Test Other Spot ${suffix}` } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  spotId = spot.id;
  otherSpotId = otherSpot.id;
  takeoffTypeId = takeoffType.id;
  landingTypeId = landingType.id;

  const site = await createSite(
    {
      label: "Site initial",
      spotId,
      siteTypeId: takeoffTypeId,
      latitude: "45.3",
      longitude: "5.9",
      altitudeM: "900",
      orientationDeg: "90",
    },
    t,
  );
  siteId = site.id;
});

afterAll(async () => {
  await prisma.site.deleteMany({ where: { id: siteId } });
  await prisma.spot.deleteMany({ where: { id: { in: [spotId, otherSpotId] } } });
  await prisma.$disconnect();
});

describe("updateSite (integration)", () => {
  it("updates the site, including re-associating it with another spot and type", async () => {
    const updated = await updateSite(
      siteId,
      {
        label: "Site modifié",
        spotId: otherSpotId,
        siteTypeId: landingTypeId,
        latitude: "45.5",
        longitude: "6.1",
        altitudeM: "300",
      },
      t,
    );

    expect(updated.label).toBe("Site modifié");
    expect(updated.spotId).toBe(otherSpotId);
    expect(updated.siteTypeId).toBe(landingTypeId);
    expect(updated.orientationDeg).toBeNull();
  });

  it("fails when the target spot does not exist", async () => {
    await expect(
      updateSite(
        siteId,
        {
          label: "Site modifié",
          spotId: crypto.randomUUID(),
          siteTypeId: takeoffTypeId,
          latitude: "45.3",
          longitude: "5.9",
          altitudeM: "900",
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails with invalid data", async () => {
    await expect(
      updateSite(
        siteId,
        {
          label: "",
          spotId,
          siteTypeId: takeoffTypeId,
          latitude: "45.3",
          longitude: "5.9",
          altitudeM: "900",
        },
        t,
      ),
    ).rejects.toThrow();
  });
});
