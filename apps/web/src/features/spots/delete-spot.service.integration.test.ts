import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { ReferenceDataInUseError } from "@/lib/reference-data-in-use.error";
import { getDictionary } from "@/messages";
import { createSpot } from "./create-spot.service";
import { deleteSpot } from "./delete-spot.service";

const t = getDictionary("fr-FR").validation.spot;
const spotInUseMessage = getDictionary("fr-FR").toast.spotInUse;

const createdSpotIds: string[] = [];

afterAll(async () => {
  await prisma.site.deleteMany({ where: { spotId: { in: createdSpotIds } } });
  await prisma.spot.deleteMany({ where: { id: { in: createdSpotIds } } });
  await prisma.$disconnect();
});

describe("deleteSpot (integration)", () => {
  it("deletes a spot with no referenced sites or sessions", async () => {
    const suffix = crypto.randomUUID();
    const spot = await createSpot({ name: `Delete Spot Test ${suffix}` }, t);
    createdSpotIds.push(spot.id);

    await deleteSpot(spot.id, spotInUseMessage);

    const found = await prisma.spot.findUnique({ where: { id: spot.id } });
    expect(found).toBeNull();
    createdSpotIds.pop();
  });

  it("refuses to delete a spot that still has sites", async () => {
    const suffix = crypto.randomUUID();
    const spot = await createSpot({ name: `Delete Spot With Sites Test ${suffix}` }, t);
    createdSpotIds.push(spot.id);

    const siteType = await prisma.siteType.findUniqueOrThrow({
      where: { code: "TAKEOFF" },
    });
    await prisma.site.create({
      data: {
        label: "Test site",
        spotId: spot.id,
        siteTypeId: siteType.id,
        latitude: 45.3,
        longitude: 5.9,
        altitudeM: 900,
      },
    });

    await expect(deleteSpot(spot.id, spotInUseMessage)).rejects.toThrow(ReferenceDataInUseError);

    const stillExists = await prisma.spot.findUnique({ where: { id: spot.id } });
    expect(stillExists).not.toBeNull();
  });
});
