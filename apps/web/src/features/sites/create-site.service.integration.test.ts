import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/messages";
import { createSite } from "./create-site.service";

const t = getDictionary("fr-FR").validation.site;

let spotId: string;
let takeoffTypeId: string;
let landingTypeId: string;
const createdSiteIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();
  const [spot, takeoffType, landingType] = await Promise.all([
    prisma.spot.create({ data: { name: `Create Site Test Spot ${suffix}` } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
  ]);
  spotId = spot.id;
  takeoffTypeId = takeoffType.id;
  landingTypeId = landingType.id;
});

afterAll(async () => {
  await prisma.site.deleteMany({ where: { id: { in: createdSiteIds } } });
  await prisma.spot.deleteMany({ where: { id: spotId } });
  await prisma.$disconnect();
});

describe("createSite (integration)", () => {
  it("creates a takeoff site associated with the spot", async () => {
    const site = await createSite(
      {
        label: "Décollage test",
        spotId,
        siteTypeId: takeoffTypeId,
        latitude: "45.3",
        longitude: "5.9",
        altitudeM: "900",
        orientationDeg: "90",
      },
      t,
    );
    createdSiteIds.push(site.id);

    expect(site.spotId).toBe(spotId);
    expect(site.siteTypeId).toBe(takeoffTypeId);
    expect(site.altitudeM).toBe(900);
    expect(site.orientationDeg).toBe(90);
  });

  it("creates a landing site without an orientation", async () => {
    const site = await createSite(
      {
        label: "Atterrissage test",
        spotId,
        siteTypeId: landingTypeId,
        latitude: "45.3",
        longitude: "5.9",
        altitudeM: "300",
      },
      t,
    );
    createdSiteIds.push(site.id);

    expect(site.siteTypeId).toBe(landingTypeId);
    expect(site.orientationDeg).toBeNull();
  });

  it("fails when the spot does not exist", async () => {
    await expect(
      createSite(
        {
          label: "Site orphelin",
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

  it("fails when the site type does not exist", async () => {
    await expect(
      createSite(
        {
          label: "Site orphelin",
          spotId,
          siteTypeId: crypto.randomUUID(),
          latitude: "45.3",
          longitude: "5.9",
          altitudeM: "900",
        },
        t,
      ),
    ).rejects.toThrow();
  });

  it("fails with invalid coordinates", async () => {
    await expect(
      createSite(
        {
          label: "Site invalide",
          spotId,
          siteTypeId: takeoffTypeId,
          latitude: "200",
          longitude: "5.9",
          altitudeM: "900",
        },
        t,
      ),
    ).rejects.toThrow();
  });
});
