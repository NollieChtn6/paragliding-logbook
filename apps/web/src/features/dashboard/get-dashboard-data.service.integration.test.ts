import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "./get-dashboard-data.service";

let userId: string;
let otherUserId: string;
let siteId: string;
let pointId: string;
let schoolId: string;
const activityIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [
    user,
    otherUser,
    site,
    school,
    flightActivityType,
    groundHandlingType,
    trainingCampType,
    takeoffType,
    flightType,
  ] = await Promise.all([
    prisma.user.create({
      data: {
        email: `dashboard-${suffix}@paragliding-logbook.local`,
        name: "Dashboard Test User",
      },
    }),
    prisma.user.create({
      data: {
        email: `dashboard-other-${suffix}@paragliding-logbook.local`,
        name: "Other User",
      },
    }),
    prisma.site.create({ data: { name: `Dashboard Test Site ${suffix}` } }),
    prisma.school.create({ data: { name: `Dashboard Test School ${suffix}` } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "FLIGHT" } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "GROUND_HANDLING" } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "TRAINING_CAMP" } }),
    prisma.sitePointType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
  ]);
  userId = user.id;
  otherUserId = otherUser.id;
  siteId = site.id;
  schoolId = school.id;

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

  // 3 vols (20 + 30 + 40 = 90 min, moyenne 30) + 2 séances de gonflage
  // (15 + 25 = 40 min) = 5 activités "comptabilisables" + 1 stage = 6
  // activités au total, pour dépasser la limite des 5 plus récentes.
  const flightDurations = [
    { date: "2025-01-01", durationMin: 20 },
    { date: "2025-02-01", durationMin: 30 },
    { date: "2025-03-01", durationMin: 40 },
  ];
  for (const { date, durationMin } of flightDurations) {
    const activity = await prisma.activity.create({
      data: { userId, activityTypeId: flightActivityType.id },
    });
    await prisma.flight.create({
      data: {
        activityId: activity.id,
        departurePointId: pointId,
        arrivalPointId: pointId,
        date: new Date(date),
        durationMin,
        flightTypeId: flightType.id,
        observations: "RAS",
        improvementPoints: "RAS",
      },
    });
    activityIds.push(activity.id);
  }

  const groundHandlingDurations = [
    { date: "2025-04-01", durationMin: 15 },
    { date: "2025-05-01", durationMin: 25 },
  ];
  for (const { date, durationMin } of groundHandlingDurations) {
    const activity = await prisma.activity.create({
      data: { userId, activityTypeId: groundHandlingType.id },
    });
    await prisma.groundHandlingSession.create({
      data: {
        activityId: activity.id,
        siteId,
        date: new Date(date),
        durationMin,
        exercises: "Contrôle au sol",
      },
    });
    activityIds.push(activity.id);
  }

  // Stage seul : compte dans le total d'activités mais pas dans les stats
  // vol/gonflage. Date la plus ancienne : doit être exclu des 5 plus récentes.
  const campActivity = await prisma.activity.create({
    data: { userId, activityTypeId: trainingCampType.id },
  });
  await prisma.trainingCamp.create({
    data: {
      activityId: campActivity.id,
      schoolId: school.id,
      campType: "Initiation",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-05"),
    },
  });
  activityIds.push(campActivity.id);

  const otherUserActivity = await prisma.activity.create({
    data: { userId: otherUserId, activityTypeId: flightActivityType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: otherUserActivity.id,
      departurePointId: pointId,
      arrivalPointId: pointId,
      date: new Date("2025-06-01"),
      durationMin: 999,
      flightTypeId: flightType.id,
      observations: "Vol d'un autre utilisateur",
      improvementPoints: "RAS",
    },
  });
  activityIds.push(otherUserActivity.id);
});

afterAll(async () => {
  await prisma.flight.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.groundHandlingSession.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.trainingCamp.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.activity.deleteMany({ where: { id: { in: activityIds } } });
  await prisma.sitePoint.deleteMany({ where: { siteId } });
  await prisma.site.delete({ where: { id: siteId } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("getDashboardData (integration)", () => {
  it("computes stats from only the current user's activities", async () => {
    const { stats } = await getDashboardData(userId);

    expect(stats.flightCount).toBe(3);
    expect(stats.totalFlightMinutes).toBe(90);
    expect(stats.averageFlightMinutes).toBe(30);
    expect(stats.groundHandlingSessionCount).toBe(2);
    expect(stats.totalGroundHandlingMinutes).toBe(40);
    expect(stats.totalActivityCount).toBe(6);
  });

  it("returns at most the 5 most recent activities, most recent first", async () => {
    const { recentActivities } = await getDashboardData(userId);

    expect(recentActivities).toHaveLength(5);
    // The most recent activity is the last ground handling session (2025-05-01).
    expect(recentActivities[0]?.groundHandlingSession?.durationMin).toBe(25);
    // The oldest activity (the training camp, 2024) must be excluded.
    expect(
      recentActivities.some((activity) => activity.trainingCamp?.campType === "Initiation"),
    ).toBe(false);
  });
});
