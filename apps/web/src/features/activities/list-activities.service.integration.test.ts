import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listActivities } from "./list-activities.service";

let userId: string;
let otherUserId: string;
let spotId: string;
let pointId: string;
const activityIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, spot, activityType, takeoffType, flightType] = await Promise.all([
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
    prisma.spot.create({ data: { name: `List Activities Test Spot ${suffix}` } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "FLIGHT" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  spotId = spot.id;

  const point = await prisma.site.create({
    data: {
      label: "Point de test",
      spotId,
      siteTypeId: takeoffType.id,
      latitude: 45.9,
      longitude: 6.9,
      altitudeM: 1200,
    },
  });
  pointId = point.id;

  // Créées dans un ordre différent de leur date de vol, pour prouver que le
  // tri se fait bien sur la date de l'événement et pas sur createdAt.
  const olderActivity = await prisma.activity.create({
    data: { userId, activityTypeId: activityType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: olderActivity.id,
      takeoffPointId: pointId,
      landingPointId: pointId,
      date: new Date("2024-01-10"),
      durationMin: 20,
      flightTypeId: flightType.id,
      observations: "Vol le plus ancien",
      improvementPoints: "RAS",
    },
  });

  const newerActivity = await prisma.activity.create({
    data: { userId, activityTypeId: activityType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: newerActivity.id,
      takeoffPointId: pointId,
      landingPointId: pointId,
      date: new Date("2025-06-15"),
      durationMin: 35,
      flightTypeId: flightType.id,
      observations: "Vol le plus récent",
      improvementPoints: "RAS",
    },
  });

  const otherUserActivity = await prisma.activity.create({
    data: { userId: otherUserId, activityTypeId: activityType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: otherUserActivity.id,
      takeoffPointId: pointId,
      landingPointId: pointId,
      date: new Date("2025-01-01"),
      durationMin: 20,
      flightTypeId: flightType.id,
      observations: "Vol d'un autre utilisateur",
      improvementPoints: "RAS",
    },
  });

  activityIds.push(olderActivity.id, newerActivity.id, otherUserActivity.id);
});

afterAll(async () => {
  await prisma.flight.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.activity.deleteMany({ where: { id: { in: activityIds } } });
  await prisma.site.deleteMany({ where: { spotId } });
  await prisma.spot.delete({ where: { id: spotId } });
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

  it("includes the activityType and the Flight specialization with its takeoff Spot", async () => {
    const activities = await listActivities(userId);

    for (const activity of activities) {
      expect(activity.activityType.code).toBe("FLIGHT");
      expect(activity.flight?.takeoffPoint.spot.id).toBe(spotId);
    }
  });
});
