import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getActivityById } from "./get-activity.service";

let userId: string;
let otherUserId: string;
let siteId: string;
let pointId: string;
let activityId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, site, activityType, takeoffType, flightType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `get-activity-${suffix}@paragliding-logbook.local`,
        name: "Get Activity Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `get-activity-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
    prisma.site.create({ data: { name: `Get Activity Test Site ${suffix}` } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "FLIGHT" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  siteId = site.id;

  const point = await prisma.sitePoint.create({
    data: {
      label: "Point de test",
      siteId,
      sitePointTypeId: takeoffType.id,
      latitude: 45.9,
      longitude: 6.9,
      altitudeM: 1200,
    },
  });
  pointId = point.id;

  const activity = await prisma.activity.create({
    data: { userId, activityTypeId: activityType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: activity.id,
      takeoffPointId: pointId,
      landingPointId: pointId,
      date: new Date("2025-06-15"),
      durationMin: 35,
      flightTypeId: flightType.id,
      observations: "Vol de test",
      improvementPoints: "RAS",
    },
  });
  activityId = activity.id;
});

afterAll(async () => {
  await prisma.flight.deleteMany({ where: { activityId } });
  await prisma.activity.deleteMany({ where: { id: activityId } });
  await prisma.sitePoint.deleteMany({ where: { siteId } });
  await prisma.site.delete({ where: { id: siteId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("getActivityById (integration)", () => {
  it("returns the activity with its Flight specialization when owned by the user", async () => {
    const activity = await getActivityById(activityId, userId);

    expect(activity?.id).toBe(activityId);
    expect(activity?.flight?.observations).toBe("Vol de test");
    expect(activity?.flight?.takeoffPoint.site.id).toBe(siteId);
  });

  it("returns null when the activity belongs to another user", async () => {
    const activity = await getActivityById(activityId, otherUserId);

    expect(activity).toBeNull();
  });

  it("returns null when the activity does not exist", async () => {
    const activity = await getActivityById(crypto.randomUUID(), userId);

    expect(activity).toBeNull();
  });
});
