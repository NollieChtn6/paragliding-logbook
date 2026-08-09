import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { createSite } from "./create-site.service";
import { deleteSite } from "./delete-site.service";

const createdSiteIds: string[] = [];

afterAll(async () => {
  await prisma.sitePoint.deleteMany({ where: { siteId: { in: createdSiteIds } } });
  await prisma.site.deleteMany({ where: { id: { in: createdSiteIds } } });
  await prisma.$disconnect();
});

describe("deleteSite (integration)", () => {
  it("deletes a site with no referenced points or sessions", async () => {
    const suffix = crypto.randomUUID();
    const site = await createSite({ name: `Delete Site Test ${suffix}` });
    createdSiteIds.push(site.id);

    await deleteSite(site.id);

    const found = await prisma.site.findUnique({ where: { id: site.id } });
    expect(found).toBeNull();
    createdSiteIds.pop();
  });

  it("refuses to delete a site that still has points", async () => {
    const suffix = crypto.randomUUID();
    const site = await createSite({ name: `Delete Site With Points Test ${suffix}` });
    createdSiteIds.push(site.id);

    const sitePointType = await prisma.sitePointType.findUniqueOrThrow({
      where: { code: "TAKEOFF" },
    });
    await prisma.sitePoint.create({
      data: {
        label: "Test point",
        siteId: site.id,
        sitePointTypeId: sitePointType.id,
        latitude: 45.3,
        longitude: 5.9,
        altitudeM: 900,
      },
    });

    await expect(deleteSite(site.id)).rejects.toThrow(ReferenceDataInUseError);

    const stillExists = await prisma.site.findUnique({ where: { id: site.id } });
    expect(stillExists).not.toBeNull();
  });
});
