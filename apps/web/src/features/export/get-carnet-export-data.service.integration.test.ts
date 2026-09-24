import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCarnetExportData } from "./get-carnet-export-data.service";

let userId: string;
let noQualificationsUserId: string;
let emptyUserId: string;
let spotId: string;
let pointId: string;
let schoolId: string;
const activityIds: string[] = [];
const userIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [
    user,
    noQualificationsUser,
    emptyUser,
    spot,
    school,
    flightActivityType,
    groundHandlingType,
    trainingCampActivityType,
    trainingCampType,
    takeoffType,
    flightType,
    qualificationType,
  ] = await Promise.all([
    prisma.user.create({
      data: { email: `export-${suffix}@paragliding-logbook.local`, name: "Export Test User" },
    }),
    prisma.user.create({
      data: {
        email: `export-no-quals-${suffix}@paragliding-logbook.local`,
        name: "No Qualifications User",
      },
    }),
    prisma.user.create({
      data: { email: `export-empty-${suffix}@paragliding-logbook.local`, name: "Empty User" },
    }),
    prisma.spot.create({ data: { name: `Export Test Spot ${suffix}` } }),
    prisma.school.create({ data: { name: `Export Test School ${suffix}` } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "FLIGHT" } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "GROUND_HANDLING" } }),
    prisma.activityType.findUniqueOrThrow({ where: { code: "TRAINING_CAMP" } }),
    prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
    prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
    prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
    prisma.qualificationType.findUniqueOrThrow({ where: { code: "PILOT" } }),
  ]);
  userId = user.id;
  noQualificationsUserId = noQualificationsUser.id;
  emptyUserId = emptyUser.id;
  spotId = spot.id;
  schoolId = school.id;
  userIds.push(userId, noQualificationsUserId, emptyUserId);

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

  // Chronologie voulue (du plus ancien au plus récent) : vol A (01-10) ->
  // gonflage C (02-05) -> vol B (03-15) -> stage D (04-01). Le filtre de
  // dates ci-dessous (02-01 -> 03-31) ne doit garder que C et B.
  const flightA = await prisma.activity.create({
    data: { userId, activityTypeId: flightActivityType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: flightA.id,
      takeoffPointId: pointId,
      landingPointId: pointId,
      date: new Date("2025-01-10"),
      durationMin: 30,
      flightTypeId: flightType.id,
      observations: "Obs A",
      improvementPoints: "Imp A",
    },
  });
  activityIds.push(flightA.id);

  const groundHandlingC = await prisma.activity.create({
    data: { userId, activityTypeId: groundHandlingType.id },
  });
  await prisma.groundHandlingSession.create({
    data: {
      activityId: groundHandlingC.id,
      spotId,
      date: new Date("2025-02-05"),
      durationMin: 20,
      exercises: "Contrôle au sol",
    },
  });
  activityIds.push(groundHandlingC.id);

  const flightB = await prisma.activity.create({
    data: { userId, activityTypeId: flightActivityType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: flightB.id,
      takeoffPointId: pointId,
      landingPointId: pointId,
      date: new Date("2025-03-15"),
      durationMin: 45,
      flightTypeId: flightType.id,
      observations: "Obs B",
      improvementPoints: "Imp B",
    },
  });
  activityIds.push(flightB.id);

  const trainingCampD = await prisma.activity.create({
    data: { userId, activityTypeId: trainingCampActivityType.id },
  });
  await prisma.trainingCamp.create({
    data: {
      activityId: trainingCampD.id,
      schoolId,
      trainingCampTypeId: trainingCampType.id,
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-04-03"),
    },
  });
  activityIds.push(trainingCampD.id);

  await prisma.qualification.create({
    data: {
      userId,
      qualificationTypeId: qualificationType.id,
      obtainedDate: new Date("2025-03-20"),
    },
  });

  // Deuxième pilote : des activités, mais aucun brevet.
  const noQualsFlight = await prisma.activity.create({
    data: { userId: noQualificationsUserId, activityTypeId: flightActivityType.id },
  });
  await prisma.flight.create({
    data: {
      activityId: noQualsFlight.id,
      takeoffPointId: pointId,
      landingPointId: pointId,
      date: new Date("2025-05-01"),
      durationMin: 25,
      flightTypeId: flightType.id,
      observations: "RAS",
      improvementPoints: "RAS",
    },
  });
  activityIds.push(noQualsFlight.id);
});

afterAll(async () => {
  await prisma.qualification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.flight.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.groundHandlingSession.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.trainingCamp.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.activity.deleteMany({ where: { id: { in: activityIds } } });
  await prisma.site.deleteMany({ where: { spotId } });
  await prisma.spot.delete({ where: { id: spotId } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("getCarnetExportData (integration)", () => {
  it("returns the full history oldest-first in compact detail when no date range is given", async () => {
    const data = await getCarnetExportData(userId);

    expect(data.detailLevel).toBe("compact");
    expect(data.activities).toHaveLength(4);
    expect(data.activities[0]?.flight?.observations).toBe("Obs A");
    expect(data.activities[1]?.groundHandlingSession?.exercises).toBe("Contrôle au sol");
    expect(data.activities[2]?.flight?.observations).toBe("Obs B");
    expect(data.activities[3]?.trainingCamp).toBeTruthy();
  });

  it("returns only activities within the inclusive date range, in full detail", async () => {
    const data = await getCarnetExportData(userId, { from: "2025-02-01", to: "2025-03-31" });

    expect(data.detailLevel).toBe("full");
    expect(data.activities).toHaveLength(2);
    // Le gonflage (type sans observations/points d'amélioration) ne doit
    // pas faire planter l'inclusion en détail complet.
    expect(data.activities[0]?.groundHandlingSession?.exercises).toBe("Contrôle au sol");
    expect(data.activities[1]?.flight?.observations).toBe("Obs B");
  });

  it("keeps the statistics summary and qualifications unaffected by the date range", async () => {
    const full = await getCarnetExportData(userId);
    const filtered = await getCarnetExportData(userId, { from: "2025-02-01", to: "2025-03-31" });

    expect(filtered.activities.length).toBeLessThan(full.activities.length);
    expect(filtered.stats).toEqual(full.stats);
    expect(filtered.stats.flightCount).toBe(2);
    expect(filtered.qualifications).toEqual(full.qualifications);
    expect(filtered.qualifications).toHaveLength(1);
  });

  it("returns an empty (not error-ing) qualifications list for a pilot with activities but no qualifications", async () => {
    const data = await getCarnetExportData(noQualificationsUserId);

    expect(data.activities).toHaveLength(1);
    expect(data.qualifications).toEqual([]);
  });

  it("returns an empty view model without throwing for a pilot with no activities and no qualifications", async () => {
    const data = await getCarnetExportData(emptyUserId);

    expect(data.activities).toEqual([]);
    expect(data.qualifications).toEqual([]);
    expect(data.stats.flightCount).toBe(0);
    expect(data.stats.cumulativeFlightHours).toBe(0);
    expect(data.stats.favoriteSite).toBeUndefined();
    expect(data.stats.longestFlightDuration).toBeUndefined();
  });
});
