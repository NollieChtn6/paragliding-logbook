import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createFlight } from "@/features/flights";
import { createGroundHandlingSession } from "@/features/ground-handling-sessions";
import { createTrainingCamp } from "@/features/training-camps";
import { prisma } from "@/lib/prisma";
import { ActivityNotFoundError } from "./activity-not-found.error";
import { deleteActivity } from "./delete-activity.service";

// Fixtures propres à ce test, indépendantes du seed dev (apps/web/prisma/seed.ts).
let userId: string;
let otherUserId: string;
let spotId: string;
let takeoffPointId: string;
let landingPointId: string;
let flightTypeId: string;
let trainingCampTypeId: string;
let schoolId: string;
const activityIds: string[] = [];

beforeAll(async () => {
  const suffix = crypto.randomUUID();

  const [user, otherUser, spot, school, takeoffType, landingType, flightType, trainingCampType] =
    await Promise.all([
      prisma.user.create({
        data: {
          email: `delete-activity-${suffix}@paragliding-logbook.local`,
          name: "Delete Activity Test User",
        },
      }),
      prisma.user.create({
        data: {
          email: `delete-activity-other-${suffix}@paragliding-logbook.local`,
          name: "Other User",
        },
      }),
      prisma.spot.create({ data: { name: `Delete Activity Test Spot ${suffix}` } }),
      prisma.school.create({ data: { name: `Delete Activity Test School ${suffix}` } }),
      prisma.siteType.findUniqueOrThrow({ where: { code: "TAKEOFF" } }),
      prisma.siteType.findUniqueOrThrow({ where: { code: "LANDING" } }),
      prisma.flightType.findUniqueOrThrow({ where: { code: "LOCAL" } }),
      prisma.trainingCampType.findUniqueOrThrow({ where: { code: "AUTONOMY" } }),
    ]);
  userId = user.id;
  otherUserId = otherUser.id;
  spotId = spot.id;
  schoolId = school.id;
  flightTypeId = flightType.id;
  trainingCampTypeId = trainingCampType.id;

  const [takeoffPoint, landingPoint] = await Promise.all([
    prisma.site.create({
      data: {
        label: "Takeoff",
        spotId,
        siteTypeId: takeoffType.id,
        latitude: 45.9,
        longitude: 6.9,
        altitudeM: 1200,
      },
    }),
    prisma.site.create({
      data: {
        label: "Landing",
        spotId,
        siteTypeId: landingType.id,
        latitude: 45.8,
        longitude: 6.8,
        altitudeM: 450,
      },
    }),
  ]);
  takeoffPointId = takeoffPoint.id;
  landingPointId = landingPoint.id;
});

afterAll(async () => {
  await prisma.flight.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.groundHandlingSession.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.trainingCamp.deleteMany({ where: { activityId: { in: activityIds } } });
  await prisma.activity.deleteMany({ where: { id: { in: activityIds } } });
  await prisma.site.deleteMany({ where: { spotId } });
  await prisma.spot.delete({ where: { id: spotId } });
  await prisma.school.delete({ where: { id: schoolId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("deleteActivity (integration)", () => {
  it("deletes a Flight's Activity and the Flight along with it", async () => {
    const flight = await createFlight(userId, {
      date: "2025-01-15",
      time: "14:30",
      takeoffPointId,
      landingPointId,
      durationMin: "35",
      flightTypeId,
      observations: "RAS",
      improvementPoints: "RAS",
    });
    activityIds.push(flight.activityId);

    await deleteActivity(userId, flight.activityId);

    const activity = await prisma.activity.findUnique({ where: { id: flight.activityId } });
    const persistedFlight = await prisma.flight.findUnique({ where: { id: flight.id } });
    expect(activity).toBeNull();
    expect(persistedFlight).toBeNull();
  });

  it("deletes a GroundHandlingSession's Activity along with it", async () => {
    const session = await createGroundHandlingSession(userId, {
      spotId,
      date: "2025-02-01",
      time: "10:00",
      durationMin: "20",
      exercises: "Contrôle au sol",
    });
    activityIds.push(session.activityId);

    await deleteActivity(userId, session.activityId);

    const activity = await prisma.activity.findUnique({ where: { id: session.activityId } });
    expect(activity).toBeNull();
  });

  it("deletes a childless TrainingCamp's Activity along with it", async () => {
    const trainingCamp = await createTrainingCamp(userId, {
      startDate: "2025-01-10",
      endDate: "2025-01-20",
      schoolId,
      trainingCampTypeId,
    });
    activityIds.push(trainingCamp.activityId);

    await deleteActivity(userId, trainingCamp.activityId);

    const activity = await prisma.activity.findUnique({ where: { id: trainingCamp.activityId } });
    expect(activity).toBeNull();
  });

  it("dissociates (does not delete) a TrainingCamp's linked Flight and GroundHandlingSession on deletion", async () => {
    const trainingCamp = await createTrainingCamp(userId, {
      startDate: "2025-01-10",
      endDate: "2025-01-20",
      schoolId,
      trainingCampTypeId,
    });
    activityIds.push(trainingCamp.activityId);

    const flight = await createFlight(userId, {
      date: "2025-01-12",
      time: "14:30",
      takeoffPointId,
      landingPointId,
      durationMin: "35",
      flightTypeId,
      trainingCampId: trainingCamp.id,
      observations: "RAS",
      improvementPoints: "RAS",
    });
    activityIds.push(flight.activityId);

    const session = await createGroundHandlingSession(userId, {
      spotId,
      date: "2025-01-13",
      time: "10:00",
      durationMin: "20",
      exercises: "Contrôle au sol",
      trainingCampId: trainingCamp.id,
    });
    activityIds.push(session.activityId);

    await deleteActivity(userId, trainingCamp.activityId);

    const persistedFlight = await prisma.flight.findUniqueOrThrow({ where: { id: flight.id } });
    const persistedSession = await prisma.groundHandlingSession.findUniqueOrThrow({
      where: { id: session.id },
    });
    expect(persistedFlight.trainingCampId).toBeNull();
    expect(persistedSession.trainingCampId).toBeNull();
  });

  it("throws ActivityNotFoundError when the activity does not exist", async () => {
    await expect(deleteActivity(userId, crypto.randomUUID())).rejects.toThrow(
      ActivityNotFoundError,
    );
  });

  it("throws ActivityNotFoundError, and does not delete, when the activity belongs to another user", async () => {
    const flight = await createFlight(userId, {
      date: "2025-01-16",
      time: "14:30",
      takeoffPointId,
      landingPointId,
      durationMin: "35",
      flightTypeId,
      observations: "RAS",
      improvementPoints: "RAS",
    });
    activityIds.push(flight.activityId);

    await expect(deleteActivity(otherUserId, flight.activityId)).rejects.toThrow(
      ActivityNotFoundError,
    );

    const activity = await prisma.activity.findUnique({ where: { id: flight.activityId } });
    expect(activity).not.toBeNull();
  });
});
