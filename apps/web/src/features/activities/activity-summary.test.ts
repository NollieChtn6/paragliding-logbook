import { describe, expect, it } from "vitest";
import { getActivitySummary } from "./activity-summary";
import type { ActivityWithDetails } from "./queries";

const site = {
  id: "site-1",
  name: "Site de test",
  region: null,
  country: null,
  latitude: null,
  longitude: null,
  primaryTakeoffPointId: null,
  primaryLandingPointId: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const otherSite = {
  ...site,
  id: "site-2",
  name: "Autre site",
};

const takeoffType = { id: "spt-takeoff", code: "TAKEOFF", label: "Décollage" };
const landingType = { id: "spt-landing", code: "LANDING", label: "Atterrissage" };

const departurePoint = {
  id: "point-1",
  label: "Décollage principal",
  siteId: site.id,
  sitePointTypeId: takeoffType.id,
  latitude: 45.9,
  longitude: 6.9,
  altitudeM: 1200,
  orientationDeg: null,
  site,
  sitePointType: takeoffType,
};

const arrivalPoint = {
  id: "point-2",
  label: "Atterrissage principal",
  siteId: site.id,
  sitePointTypeId: landingType.id,
  latitude: 45.8,
  longitude: 6.8,
  altitudeM: 450,
  orientationDeg: null,
  site,
  sitePointType: landingType,
};

const school = {
  id: "school-1",
  name: "École de test",
  website: null,
  location: null,
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
  it("summarizes a Flight departing and arriving at the same site", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-1", code: "FLIGHT", label: "Vol" },
      flight: {
        id: "flight-1",
        activityId: "activity-1",
        departurePointId: departurePoint.id,
        arrivalPointId: arrivalPoint.id,
        trainingCampId: null,
        date: new Date("2025-06-15"),
        durationMin: 35,
        flightType: "LOCAL",
        observations: "RAS",
        improvementPoints: "RAS",
        departurePoint,
        arrivalPoint,
        trainingCamp: null,
      },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "Vol",
      subtitle: "Site de test · 15/06/2025 · 35 min",
    });
  });

  it("summarizes a Flight departing and arriving at different sites", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-1", code: "FLIGHT", label: "Vol" },
      flight: {
        id: "flight-2",
        activityId: "activity-1",
        departurePointId: departurePoint.id,
        arrivalPointId: arrivalPoint.id,
        trainingCampId: null,
        date: new Date("2025-06-15"),
        durationMin: 90,
        flightType: "CROSS",
        observations: "RAS",
        improvementPoints: "RAS",
        departurePoint,
        arrivalPoint: { ...arrivalPoint, site: otherSite },
        trainingCamp: null,
      },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "Vol",
      subtitle: "Site de test → Autre site · 15/06/2025 · 90 min",
    });
  });

  it("summarizes a TrainingCamp", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-2", code: "TRAINING_CAMP", label: "Stage" },
      trainingCamp: {
        id: "camp-1",
        activityId: "activity-1",
        schoolId: school.id,
        campType: "Perfectionnement",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-05"),
        summary: null,
        certification: null,
        school,
        flights: [],
        groundHandlingSessions: [],
      },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "Stage",
      subtitle: "École de test · 01/07/2025 → 05/07/2025",
    });
  });

  it("summarizes a GroundHandlingSession", () => {
    const activity: ActivityWithDetails = {
      ...baseActivity,
      activityType: { id: "at-3", code: "GROUND_HANDLING", label: "Gonflage" },
      groundHandlingSession: {
        id: "ghs-1",
        activityId: "activity-1",
        siteId: site.id,
        trainingCampId: null,
        date: new Date("2025-03-10"),
        durationMin: 45,
        exercises: "Contrôle au sol",
        difficulties: null,
        feeling: null,
        site,
        trainingCamp: null,
      },
    };

    expect(getActivitySummary(activity)).toEqual({
      title: "Gonflage",
      subtitle: "Site de test · 10/03/2025 · 45 min",
    });
  });
});
