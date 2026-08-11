import { describe, expect, it } from "vitest";
import { getActivitySummary } from "./activity-summary";
import type { ActivityWithDetails } from "./queries";

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

const otherSpot = {
  ...spot,
  id: "spot-2",
  name: "Autre spot",
};

const takeoffType = { id: "spt-takeoff", code: "TAKEOFF" };
const landingType = { id: "spt-landing", code: "LANDING" };
const localFlightType = { id: "ft-local", code: "LOCAL" };
const crossCountryFlightType = { id: "ft-cross-country", code: "CROSS_COUNTRY" };

const trainingCampType = {
  id: "tct-1",
  code: "AUTONOMY",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const takeoffPoint = {
  id: "site-1",
  label: "Décollage principal",
  spotId: spot.id,
  siteTypeId: takeoffType.id,
  latitude: 45.9,
  longitude: 6.9,
  altitudeM: 1200,
  orientationDeg: null,
  spot,
  siteType: takeoffType,
};

const landingPoint = {
  id: "site-2",
  label: "Atterrissage principal",
  spotId: spot.id,
  siteTypeId: landingType.id,
  latitude: 45.8,
  longitude: 6.8,
  altitudeM: 450,
  orientationDeg: null,
  spot,
  siteType: landingType,
};

const school = {
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
};

const baseActivity = {
  id: "activity-1",
  userId: "user-1",
  activityTypeId: "activity-type-1",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  flight: null,
  trainingCamp: null,
  groundHandlingSession: null,
};

describe("getActivitySummary", () => {
  it("summarizes a Flight taking off and landing at the same spot", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-1", code: "FLIGHT" },
      flight: {
        id: "flight-1",
        activityId: "activity-1",
        takeoffPointId: takeoffPoint.id,
        landingPointId: landingPoint.id,
        flightTypeId: localFlightType.id,
        trainingCampId: null,
        date: new Date("2025-06-15T09:15:00.000Z"),
        durationMin: 35,
        observations: "RAS",
        improvementPoints: "RAS",
        takeoffPoint,
        landingPoint,
        flightType: localFlightType,
        trainingCamp: null,
      },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "Vol",
      location: "Spot de test",
      dateInfo: "15/06/2025 à 09:15",
    });
  });

  it("summarizes a Flight taking off and landing at different spots", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-1", code: "FLIGHT" },
      flight: {
        id: "flight-2",
        activityId: "activity-1",
        takeoffPointId: takeoffPoint.id,
        landingPointId: landingPoint.id,
        flightTypeId: crossCountryFlightType.id,
        trainingCampId: null,
        date: new Date("2025-06-15T13:45:00.000Z"),
        durationMin: 90,
        observations: "RAS",
        improvementPoints: "RAS",
        takeoffPoint,
        landingPoint: { ...landingPoint, spot: otherSpot },
        flightType: crossCountryFlightType,
        trainingCamp: null,
      },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "Vol",
      location: "Spot de test → Autre spot",
      dateInfo: "15/06/2025 à 13:45",
    });
  });

  it("summarizes a TrainingCamp", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-2", code: "TRAINING_CAMP" },
      trainingCamp: {
        id: "camp-1",
        activityId: "activity-1",
        schoolId: school.id,
        trainingCampTypeId: trainingCampType.id,
        trainingCampType,
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-05"),
        observations: null,
        summary: null,
        certification: null,
        school,
        flights: [],
        groundHandlingSessions: [],
      },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "Stage",
      location: "École de test",
      dateInfo: "01/07/2025 → 05/07/2025",
    });
  });

  it("summarizes a GroundHandlingSession", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-3", code: "GROUND_HANDLING" },
      groundHandlingSession: {
        id: "ghs-1",
        activityId: "activity-1",
        spotId: spot.id,
        trainingCampId: null,
        date: new Date("2025-03-10T18:00:00.000Z"),
        durationMin: 45,
        exercises: "Contrôle au sol",
        difficulties: null,
        feeling: null,
        spot,
        trainingCamp: null,
      },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "Gonflage",
      location: "Spot de test",
      dateInfo: "10/03/2025 à 18:00",
    });
  });

  it("falls back to the reference dictionary label for an unrecognized activity type", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-9", code: "UNKNOWN_TYPE" },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "UNKNOWN_TYPE",
      location: "",
      dateInfo: "",
    });
  });
});
