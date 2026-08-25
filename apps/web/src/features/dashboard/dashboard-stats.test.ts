import { describe, expect, it } from "vitest";
import type { ActivityWithDetails } from "@/features/activities";
import { getDashboardStats } from "./dashboard-stats";

const spot = {
  id: "spot-1",
  name: "Spot de test",
  region: null,
  countryCode: null,
  latitude: null,
  longitude: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const takeoffType = { id: "spt-takeoff", code: "TAKEOFF" };
const localFlightType = { id: "ft-local", code: "LOCAL" };

const point = {
  id: "site-1",
  label: "Point de test",
  spotId: spot.id,
  siteTypeId: takeoffType.id,
  latitude: 45.9,
  longitude: 6.9,
  altitudeM: 1200,
  orientationDeg: null,
  spot,
  siteType: takeoffType,
};

const baseActivity = {
  userId: "user-1",
  activityTypeId: "activity-type-1",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  flight: null,
  trainingCamp: null,
  groundHandlingSession: null,
};

function flightActivity(id: string, durationMin: number): ActivityWithDetails {
  return {
    ...baseActivity,
    id,
    activityType: { id: "at-1", code: "FLIGHT" },
    flight: {
      id: `flight-${id}`,
      activityId: id,
      takeoffPointId: point.id,
      landingPointId: point.id,
      flightTypeId: localFlightType.id,
      trainingCampId: null,
      date: new Date("2025-06-15"),
      durationMin,
      observations: "RAS",
      improvementPoints: "RAS",
      takeoffPoint: point,
      landingPoint: point,
      flightType: localFlightType,
      trainingCamp: null,
    },
  };
}

function groundHandlingActivity(id: string, durationMin: number): ActivityWithDetails {
  return {
    ...baseActivity,
    id,
    activityType: { id: "at-3", code: "GROUND_HANDLING" },
    groundHandlingSession: {
      id: `ghs-${id}`,
      activityId: id,
      spotId: spot.id,
      trainingCampId: null,
      date: new Date("2025-03-10"),
      durationMin,
      exercises: "Contrôle au sol",
      difficulties: null,
      feeling: null,
      spot,
      trainingCamp: null,
    },
  };
}

function trainingCampActivity(id: string): ActivityWithDetails {
  return {
    ...baseActivity,
    id,
    activityType: { id: "at-2", code: "TRAINING_CAMP" },
    trainingCamp: {
      id: `camp-${id}`,
      activityId: id,
      schoolId: "school-1",
      trainingCampTypeId: "tct-1",
      trainingCampType: {
        id: "tct-1",
        code: "AUTONOMY",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-07-05"),
      observations: null,
      summary: null,
      qualificationTypeId: null,
      qualificationType: null,
      school: {
        id: "school-1",
        name: "École de test",
        website: null,
        address: null,
        postalCode: null,
        city: null,
        countryCode: null,
        latitude: null,
        longitude: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
      flights: [],
      groundHandlingSessions: [],
    },
  };
}

describe("getDashboardStats", () => {
  it("returns all zeros for an empty activity list", () => {
    expect(getDashboardStats([])).toEqual({
      flightCount: 0,
      totalFlightMinutes: 0,
      averageFlightMinutes: null,
      groundHandlingSessionCount: 0,
      totalGroundHandlingMinutes: 0,
      trainingCampCount: 0,
      totalActivityCount: 0,
    });
  });

  it("counts and sums flights only", () => {
    const activities = [flightActivity("1", 30), flightActivity("2", 45)];

    const stats = getDashboardStats(activities);

    expect(stats.flightCount).toBe(2);
    expect(stats.totalFlightMinutes).toBe(75);
    expect(stats.averageFlightMinutes).toBe(38);
  });

  it("counts and sums ground handling sessions only", () => {
    const activities = [groundHandlingActivity("1", 20), groundHandlingActivity("2", 40)];

    const stats = getDashboardStats(activities);

    expect(stats.groundHandlingSessionCount).toBe(2);
    expect(stats.totalGroundHandlingMinutes).toBe(60);
  });

  it("counts every activity, including training camps, in the total", () => {
    const activities = [
      flightActivity("1", 30),
      groundHandlingActivity("2", 20),
      trainingCampActivity("3"),
    ];

    const stats = getDashboardStats(activities);

    expect(stats.totalActivityCount).toBe(3);
  });

  it("counts training camps only", () => {
    const activities = [
      trainingCampActivity("1"),
      trainingCampActivity("2"),
      flightActivity("3", 30),
    ];

    const stats = getDashboardStats(activities);

    expect(stats.trainingCampCount).toBe(2);
  });
});
