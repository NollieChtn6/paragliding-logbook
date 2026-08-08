import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listActivities } from "./list-activities.service";

let userId: string;
let otherUserId: string;
let siteId: string;
const activityIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, site, flightType] = await Promise.all([
    prisma.user.create({
      data: {
        email: `list-activities-${suffix}@paragliding-logbook.local`,
        name: "List Activities Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `list-activities-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
    prisma.site.create({ data: { name: `List Activities Test Site ${suffix}` } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "FLIGHT" } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  siteId = site.id;

  // Créées dans un ordre différent de leur date de vol, pour prouver que le
  // tri se fait bien sur la date de l'événement et pas sur createdAt.
  const olderActivity = await prisma.activity.create({
    data: { userId, activityTypeId: flightType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: olderActivity.id,
      siteId,
      date: new Date("2024-01-10"),
      takeoffAltitudeM: 1000,
      landingAltitudeM: 400,
      durationMin: 20,
      flightType: "LOCAL",
      observations: "Vol le plus ancien",
      improvementPoints: "RAS",
    },
  });

  const newerActivity = await prisma.activity.create({
    data: { userId, activityTypeId: flightType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: newerActivity.id,
      siteId,
      date: new Date("2025-06-15"),
      takeoffAltitudeM: 1200,
      landingAltitudeM: 450,
      durationMin: 35,
      flightType: "LOCAL",
      observations: "Vol le plus récent",
      improvementPoints: "RAS",
    },
  });

  const otherUserActivity = await prisma.activity.create({
    data: { userId: otherUserId, activityTypeId: flightType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: otherUserActivity.id,
      siteId,
      date: new Date("2025-01-01"),
      takeoffAltitudeM: 1000,
      landingAltitudeM: 400,
      durationMin: 20,
      flightType: "LOCAL",
      observations: "Vol d'un autre utilisateur",
      improvementPoints: "RAS",
    },
  });

  activityIds.push(olderActivity.id, newerActivity.id, otherUserActivity.id);
});

afterAll(async () => {
  await prisma.flight.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.activity.deleteMany({ where: { id: { in: activityIds } } });
  await prisma.site.delete({ where: { id: siteId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("listActivities (integration)", () => {
  it("returns only the current user's activities, most recent event date first", async () => {
    const activities = await listActivities(userId);

    expect(activities).toHaveLength(2);
    expect(activities[0]?.flight?.observations).toBe("Vol le plus récent");
    expect(activities[1]?.flight?.observations).toBe("Vol le plus ancien");
    expect(activities.some((activity) => activity.userId === otherUserId)).toBe(false);
  });

  it("includes the activityType and the Flight specialization with its Site", async () => {
    const activities = await listActivities(userId);

    for (const activity of activities) {
      expect(activity.activityType.code).toBe("FLIGHT");
      expect(activity.flight?.site.id).toBe(siteId);
    }
  });
});
