import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getActivityById } from "./get-activity.service";

let userId: string;
let otherUserId: string;
let siteId: string;
let activityId: string;

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, site, flightType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `get-activity-${suffix}@paragliding-logbook.local`,
        name: "Get Activity Test User",
        passwordHash: await hashPassword(`not-a-real-password-${suffix}`),
      },
    }),
    prisma.user.create({
      data: {
        email: `get-activity-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
        passwordHash: await hashPassword(`not-a-real-password-other-${suffix}`),
      },
    }),
    prisma.site.create({ data: { name: `Get Activity Test Site ${suffix}` } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "FLIGHT" } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  siteId = site.id;

  const activity = await prisma.activity.create({
    data: { userId, activityTypeId: flightType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: activity.id,
      siteId,
      date: new Date("2025-06-15"),
      takeoffAltitudeM: 1200,
      landingAltitudeM: 450,
      durationMin: 35,
      flightType: "LOCAL",
      observations: "Vol de test",
      improvementPoints: "RAS",
    },
  });
  activityId = activity.id;
});

afterAll(async () => {
  await prisma.flight.deleteMany({ where: { activityId } });
  await prisma.activity.deleteMany({ where: { id: activityId } });
  await prisma.site.delete({ where: { id: siteId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("getActivityById (integration)", () => {
  it("returns the activity with its Flight specialization when owned by the user", async () => {
    const activity = await getActivityById(activityId, userId);

    expect(activity?.id).toBe(activityId);
    expect(activity?.flight?.observations).toBe("Vol de test");
    expect(activity?.flight?.site.id).toBe(siteId);
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
